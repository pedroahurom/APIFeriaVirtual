const pool = require('./connectDatabase');
const Universidad = require('./universidad.model');

const TestVocacional = function (testPuntaje) {
    this.aireLibre = testPuntaje.aireLibre;
    this.mecanica = testPuntaje.mecanica;
    this.calculo = testPuntaje.calculo;
    this.ciencia = testPuntaje.ciencia;
    this.persuasiva = testPuntaje.persuasiva;
    this.artes = testPuntaje.artes;
    this.linguistica = testPuntaje.linguistica;
    this.musica = testPuntaje.musica;
    this.social = testPuntaje.social;
    this.administrativa = testPuntaje.administrativa;
}

/**
 * 
 * @param {Object} testPuntaje Objeto con los puntajes del test
 * @param {string} grupoEdad Grupo de edad del test
 * @param {string} genero Genero de estudiante 
 * @param {callback} result Callback con el resultado del test 
 */
TestVocacional.calcularCentil = (testPuntaje, grupoEdad, genero, result) => {
    genero = genero ? 'Femenino' : 'Masculino';
    const condicion = `${grupoEdad}_${genero}`;

    let centilPuntajes = {
        aireLibre: 0,
        mecanica: 0,
        calculo: 0,
        ciencia: 0,
        persuasiva: 0,
        artes: 0,
        linguistica: 0,
        musica: 0,
        social: 0,
        administrativa: 0
    };

    let centilesCalculados;

    if (condicion == '1_Masculino') {
        centilesCalculados = TestVocacional.filter1(testPuntaje);
    }
    if (condicion == '1_Femenino') {
        centilesCalculados = TestVocacional.filter2(testPuntaje, centilPuntajes);
    }
    if (condicion == '2_Masculino' || condicion == '2_Femenino') {
        centilesCalculados = TestVocacional.filter3(testPuntaje, centilPuntajes);
    }
    if (condicion == '3_Masculino' || condicion == '3_Femenino') {
        centilesCalculados = TestVocacional.filter4(testPuntaje, centilPuntajes);
    }

    let area1;
    let area2;
    let centilMaximo = 0;
    let centilMaximoDos = 0;

    Object.values(centilesCalculados).forEach((centil, index) => {
        if (centilMaximo < centil) {
            area1 = index;
            centilMaximo = centil;
        }
    });

    Object.values(centilesCalculados).forEach((centil, index) => {
        if (centilMaximoDos < centil && index != area1) {
            area2 = index;
            centilMaximoDos = centil;
        }
    });

    let query = `
    SELECT DISTINCT
        universidad.ID AS Universidad_ID, 
        universidad.Nombre, 
        universidad.Ruta_Escudo, 
        IF(universidad.Tipo=0,'Publica','Privada') AS Tipo,
        IF(COUNT(beca.Titulo) > 0, 1, 0) AS BECA,
        COUNT(IF(nivel_educativo.Nombre='LICENCIATURA',1, NULL)) AS LICENCIATURA, 
        COUNT(IF(nivel_educativo.Nombre='MAESTR&IACUTE;A',1, NULL)) AS MAESTRIA, 
        COUNT(IF(nivel_educativo.Nombre='DOCTORADO',1, NULL)) AS DOCTORADO
    FROM 
        universidad 
    INNER JOIN 
        carrera ON
            universidad.ID = carrera.Universidad_ID
    INNER JOIN 
        nivel_educativo ON 
            carrera.Nivel_Educativo_ID = nivel_educativo.ID 
    LEFT JOIN 
        beca ON 
            universidad.ID = beca.Universidad_ID
    INNER JOIN 
        carrera_area ON 
            carrera_area.Carrera_ID= carrera.ID
    WHERE (carrera_area.Area_ID = ${area1} OR carrera_area.Area_ID = ${area2}) AND universidad.Estatus_ID = 3
        GROUP BY universidad.ID 
        ORDER BY universidad.ID 
    ASC
    `;

    let queryGetArea = `
    SELECT
        carrera.Universidad_ID,
        GROUP_CONCAT(DISTINCT carrera_clasificacion.area1) AS area1,
        CONCAT (GROUP_CONCAT(DISTINCT carrera_clasificacion.area2)) AS area2,
        CONCAT (GROUP_CONCAT(DISTINCT carrera_clasificacion.area3)) AS area3
     FROM 
        carrera
     INNER JOIN carrera_clasificacion
     ON 
        carrera.Nombre = carrera_clasificacion.nombre_carrera
    INNER JOIN 
        carrera_area ON 
            carrera_area.Carrera_ID= carrera.ID
    WHERE carrera_area.Area_ID= ${area1} OR carrera_area.Area_ID= ${area2}
    GROUP BY carrera.Universidad_ID
    ORDER BY carrera.Universidad_ID
    ASC`;

    pool.query(query, (err, res) => {
        if (err) {
            result(null, {
                ...centilesCalculados,
                universidades: {
                    Universidad_ID: 0,
                    Nombre: "NA",
                    Ruta_Escudo: "NA",
                    Tipo: "NA",
                    BECA: 0,
                    LICENCIATURA: 0,
                    MAESTRIA: 0,
                    DOCTORADO: 0,
                    area: "NA",
                }
            });
            return;
        } 
        pool.query(queryGetArea, (err, resAreas) => {
            if (err) {
                result(null, {
                    ...centilesCalculados,
                    universidades: res.map(universidad => {
                        return {
                            ...universidad,
                            area: "NA",
                        }
                    }),
                });
                return;
            }
            for (let i = 0; i < res.length; i++) {
                for (let j = 0; j < resAreas.length; j++) {
                    if (res[i].Universidad_ID == resAreas[j].Universidad_ID) {
                        res[i].area = resAreas[j].area1 + " " + resAreas[j].area2 + " " + resAreas[j].area3;
                    } else {
                        res[i].area = "NA";
                    }
                }
            }
            result(null, {
                ...centilesCalculados,
                universidades: res,
            });
        });
    });
};

TestVocacional.filter1 = (testPuntaje) => {

    //AIRE LIBRE

    const opAl = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5, 5, 5, 10, 10, 10, 10, 15, 15, 15, 20, 20, 25, 25, 30, 30, 35, 35, 40, 45, 45, 50, 55, 55, 60, 60, 65, 70, 70, 75, 75, 80, 80, 85, 85, 85, 90, 90, 90, 90, 95, 95, 95, 96, 97, 97, 98, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99]
    const aireLibre = opAl[testPuntaje.aireLibre];

    // MECANICA
    const opMe = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 4, 5, 5, 10, 10, 10, 15, 15, 20, 25, 25, 30, 35, 40, 45, 45, 50, 55, 60, 65, 70, 75, 75, 80, 85, 85, 90, 90, 90, 95, 95, 96, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const mecanica = opMe[testPuntaje.mecanica];
    //CALCULO

    const opCa = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 10, 10, 15, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 96, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const calculo = opCa[testPuntaje.calculo];

    //CIENCIA
    const opCi = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 5, 5, 5, 10, 10, 10, 15, 15, 20, 20, 25, 30, 30, 35, 40, 45, 45, 50, 55, 60, 65, 65, 70, 75, 75, 80, 80, 85, 85, 90, 90, 90, 95, 95, 96, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99];

    const ciencia = opCi[testPuntaje.ciencia];

    //PERSUASIVA
    const opPe = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 10, 10, 10, 15, 15, 20, 25, 25, 30, 35, 40, 45, 50, 55, 55, 60, 65, 70, 75, 75, 80, 85, 85, 90, 90, 95, 95, 95, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const persuasiva = opPe[testPuntaje.persuasiva];

    //ARTES

    const opAr = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 10, 10, 15, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 95, 97, 97, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const artes = opAr[testPuntaje.artes];

    //LINGUISTICA

    const opLi = [1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 10, 10, 15, 20, 25, 30, 35, 45, 50, 55, 60, 70, 75, 80, 85, 85, 90, 90, 95, 96, 97, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const linguistica = opLi[testPuntaje.linguistica];

    //MUSICA
    const opMu = [2, 3, 4, 5, 5, 10, 10, 15, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70, 75, 80, 85, 90, 90, 95, 96, 97, 98, 99, 99, 99, 99];

    const musica = opMu[testPuntaje.musica];

    //SOCIAL O ASISTENCIA
    const opSo = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 5, 10, 10, 10, 15, 15, 20, 20, 25, 30, 30, 35, 40, 45, 45, 50, 55, 60, 60, 65, 70, 75, 75, 80, 80, 85, 85, 90, 90, 90, 95, 95, 96, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const social = opSo[testPuntaje.social];

    //ADMINISTRATIVA
    const opAd = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 4, 5, 5, 5, 10, 10, 10, 15, 15, 19, 20, 20, 25, 30, 30, 35, 40, 40, 45, 50, 50, 55, 60, 65, 65, 70, 70, 75, 80, 80, 85, 85, 85, 90, 90, 90, 95, 95, 95, 97, 97, 98, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const administrativa = opAd[testPuntaje.administrativa];

    const centilPuntaje = {
        aireLibre: aireLibre,
        mecanica: mecanica,
        calculo: calculo,
        ciencia: ciencia,
        persuasiva: persuasiva,
        artes: artes,
        linguistica: linguistica,
        musica: musica,
        social: social,
        administrativa: administrativa
    };

    return centilPuntaje;
}

TestVocacional.filter2 = (testPuntaje) => {
    //AIRE LIBRE

    const opAl = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 4, 4, 5, 5, 5, 10, 10, 10, 10, 15, 15, 20, 20, 25, 25, 30, 30, 35, 35, 40, 45, 45, 50, 55, 55, 60, 60, 65, 70, 70, 75, 75, 80, 80, 85, 85, 85, 90, 90, 90, 95, 95, 95, 95, 97, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const aireLibre = opAl[testPuntaje.aireLibre];

    // MECANICA
    const opMe = [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 10, 10, 15, 15, 20, 25, 30, 35, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 95, 95, 97, 97, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const mecanica = opMe[testPuntaje.mecanica];

    //CALCULO

    const opCa = [1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 5, 5, 10, 10, 15, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 80, 85, 90, 90, 95, 95, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const calculo = opCa[testPuntaje.calculo];

    //CIENCIA
    const opCi = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 5, 5, 10, 10, 10, 15, 15, 15, 20, 20, 25, 30, 30, 35, 40, 40, 45, 50, 55, 55, 60, 65, 70, 70, 75, 75, 80, 85, 85, 85, 90, 90, 90, 95, 95, 96, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const ciencia = opCi[testPuntaje.ciencia];

    //PERSUASIVA
    const opPe = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 5, 10, 10, 10, 15, 15, 20, 25, 25, 30, 35, 35, 40, 45, 50, 55, 60, 60, 65, 70, 75, 75, 80, 85, 85, 85, 90, 90, 95, 95, 95, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const persuasiva = opPe[testPuntaje.persuasiva];

    //ARTES

    const opAr = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 10, 10, 15, 20, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 95, 97, 97, 98, 99, 99, 99, 99, 99, 99, 99, 99];

    const artes = opAr[testPuntaje.artes];

    //LINGUISTICA

    const opLi = [1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 10, 10, 15, 20, 25, 25, 30, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 90, 95, 95, 97, 97, 98, 99, 99, 99, 99, 99, 99, 99, 99];

    const linguistica = opLi[testPuntaje.linguistica];

    //MUSICA
    const opMu = [1, 1, 1, 1, 2, 3, 5, 5, 10, 15, 15, 20, 25, 35, 40, 45, 55, 60, 70, 75, 80, 85, 90, 90, 95, 95, 97, 98, 99, 99, 99];

    const musica = opMu[testPuntaje.musica];

    //SOCIAL O ASISTENCIA
    const opSo = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 5, 5, 10, 10, 15, 15, 15, 20, 20, 25, 25, 30, 30, 35, 40, 45, 45, 50, 55, 60, 60, 65, 70, 75, 75, 80, 80, 85, 85, 90, 90, 90, 95, 95, 95, 97, 97, 98, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const social = opSo[testPuntaje.social];

    //ADMINISTRATIVA
    const opAd = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 5, 5, 5, 5, 10, 10, 10, 15, 15, 15, 20, 20, 25, 25, 30, 30, 35, 40, 40, 45, 45, 50, 55, 55, 60, 65, 65, 70, 70, 75, 75, 80, 80, 85, 85, 85, 90, 90, 90, 95, 95, 95, 96, 97, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const administrativa = opAd[testPuntaje.administrativa];

    const centilPuntaje = {
        aireLibre: aireLibre,
        mecanica: mecanica,
        calculo: calculo,
        ciencia: ciencia,
        persuasiva: persuasiva,
        artes: artes,
        linguistica: linguistica,
        musica: musica,
        social: social,
        administrativa: administrativa
    };

    return centilPuntaje;
}

TestVocacional.filter3 = (testPuntaje) => {
    //AIRE LIBRE
    const opAl = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5, 5, 5, 10, 10, 10, 10, 15, 15, 15, 20, 20, 25, 25, 30, 30, 35, 35, 40, 45, 45, 50, 55, 55, 60, 60, 65, 70, 70, 75, 75, 80, 80, 85, 85, 85, 90, 90, 90, 90, 95, 95, 95, 96, 97, 97, 98, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const aireLibre = opAl[testPuntaje.aireLibre];

    // MECANICA
    const opMe = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 4, 5, 5, 10, 10, 10, 15, 15, 20, 25, 25, 30, 35, 40, 45, 45, 50, 55, 60, 65, 70, 75, 75, 80, 85, 85, 90, 90, 90, 95, 95, 96, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const mecanica = opMe[testPuntaje.mecanica];

    //CALCULO

    const opCa = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 10, 10, 15, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 96, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const calculo = opCa[testPuntaje.calculo];

    //CIENCIA
    const opCi = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 5, 5, 5, 10, 10, 10, 15, 15, 20, 20, 25, 30, 30, 35, 40, 45, 45, 50, 55, 60, 65, 65, 70, 75, 75, 80, 80, 85, 85, 90, 90, 90, 95, 95, 96, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99];

    const ciencia = opCi[testPuntaje.ciencia];

    //PERSUASIVA
    const opPe = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 10, 10, 10, 15, 15, 20, 25, 25, 30, 35, 40, 45, 50, 55, 55, 60, 65, 70, 75, 75, 80, 85, 85, 90, 90, 95, 95, 95, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const persuasiva = opPe[testPuntaje.persuasiva];

    //ARTES

    const opAr = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 10, 10, 15, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 95, 97, 97, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const artes = opAr[testPuntaje.artes];

    //LINGUISTICA

    const opLi = [1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 10, 10, 15, 20, 25, 30, 35, 45, 50, 55, 60, 70, 75, 80, 85, 85, 90, 90, 95, 96, 97, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const linguistica = opLi[testPuntaje.linguistica];

    //MUSICA
    const opMu = [2, 3, 4, 5, 5, 10, 10, 15, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70, 75, 80, 85, 90, 90, 95, 96, 97, 98, 99, 99, 99, 99];

    const musica = opMu[testPuntaje.musica];

    //SOCIAL O ASISTENCIA
    const opSo = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 5, 10, 10, 10, 15, 15, 20, 20, 25, 30, 30, 35, 40, 45, 45, 50, 55, 60, 60, 65, 70, 75, 75, 80, 80, 85, 85, 90, 90, 90, 95, 95, 96, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const social = opSo[testPuntaje.social];

    //ADMINISTRATIVA
    const opAd = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 4, 5, 5, 5, 10, 10, 10, 15, 15, 19, 20, 20, 25, 30, 30, 35, 40, 40, 45, 50, 50, 55, 60, 65, 65, 70, 70, 75, 80, 80, 85, 85, 85, 90, 90, 90, 95, 95, 95, 97, 97, 98, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const administrativa = opAd[testPuntaje.administrativa];

    const centilPuntaje = {
        aireLibre: aireLibre,
        mecanica: mecanica,
        calculo: calculo,
        ciencia: ciencia,
        persuasiva: persuasiva,
        artes: artes,
        linguistica: linguistica,
        musica: musica,
        social: social,
        administrativa: administrativa
    };

    return centilPuntaje;
}

TestVocacional.filter4 = (testPuntaje) => {

    //AIRE LIBRE
    const opAl = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 11, 4, 4, 5, 5, 5, 10, 10, 10, 10, 15, 15, 20, 20, 25, 25, 30, 30, 35, 35, 40, 45, 45, 50, 55, 55, 60, 60, 65, 70, 70, 75, 75, 80, 80, 85, 85, 85, 90, 90, 90, 95, 95, 95, 95, 97, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const aireLibre = opAl[testPuntaje.aireLibre];

    // MECANICA
    const opMe = [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 10, 10, 15, 15, 20, 25, 30, 35, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 95, 95, 97, 97, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const mecanica = opMe[testPuntaje.mecanica];

    //CALCULO

    const opCa = [1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 5, 5, 10, 10, 15, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 80, 85, 90, 90, 95, 95, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const calculo = opCa[testPuntaje.calculo];

    //CIENCIA
    const opCi = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 5, 5, 10, 10, 10, 15, 15, 15, 20, 20, 25, 30, 30, 35, 40, 40, 45, 50, 55, 55, 60, 65, 70, 70, 75, 75, 80, 85, 85, 85, 90, 90, 90, 95, 95, 96, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const ciencia = opCi[testPuntaje.ciencia];

    //PERSUASIVA
    const opPe = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 5, 10, 10, 10, 15, 15, 20, 25, 25, 30, 35, 35, 40, 45, 50, 55, 60, 60, 65, 70, 75, 75, 80, 85, 85, 85, 90, 90, 95, 95, 95, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const persuasiva = opPe[testPuntaje.persuasiva];

    //ARTES

    const opAr = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 10, 10, 15, 20, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 95, 97, 97, 98, 99, 99, 99, 99, 99, 99, 99, 99];

    const artes = opAr[testPuntaje.artes];

    //LINGUISTICA

    const opLi = [1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 10, 10, 15, 20, 25, 25, 30, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 90, 95, 95, 97, 97, 98, 99, 99, 99, 99, 99, 99, 99, 99];

    const linguistica = opLi[testPuntaje.linguistica];

    //MUSICA
    const opMu = [1, 1, 1, 1, 2, 3, 5, 5, 10, 15, 15, 20, 25, 35, 40, 45, 55, 60, 70, 75, 80, 85, 90, 90, 95, 95, 97, 98, 99, 99, 99];

    const musica = opMu[testPuntaje.musica];

    //SOCIAL O ASISTENCIA
    const opSo = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 5, 5, 10, 10, 15, 15, 15, 20, 20, 25, 25, 30, 30, 35, 40, 45, 45, 50, 55, 60, 60, 65, 70, 75, 75, 80, 80, 85, 85, 90, 90, 90, 95, 95, 95, 97, 97, 98, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const social = opSo[testPuntaje.social];

    //ADMINISTRATIVA
    const opAd = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 5, 5, 5, 5, 10, 10, 10, 15, 15, 15, 20, 20, 25, 25, 30, 30, 35, 40, 40, 45, 45, 50, 55, 55, 60, 65, 65, 70, 70, 75, 75, 80, 80, 85, 85, 85, 90, 90, 90, 95, 95, 95, 96, 97, 97, 97, 98, 98, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];

    const administrativa = opAd[testPuntaje.administrativa];

    const centilPuntaje = {
        aireLibre: aireLibre,
        mecanica: mecanica,
        calculo: calculo,
        ciencia: ciencia,
        persuasiva: persuasiva,
        artes: artes,
        linguistica: linguistica,
        musica: musica,
        social: social,
        administrativa: administrativa
    };

    return centilPuntaje;
}


module.exports = TestVocacional;