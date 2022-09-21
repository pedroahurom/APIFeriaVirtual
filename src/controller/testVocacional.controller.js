const TestVocacional = require('../model/testVocacional.model.js');


exports.calificarTest = (req, res) => {
    if (!req.body) {
        res.status(400).send({
          message: "No puede estar vacio"
        });
    }
    const { 
        aireLibre, 
        mecanica,
        calculo,
        ciencia,
        persuasiva,
        artes,
        linguistica,
        musica,
        social,
        administrativa,
        grupoEdad,
        genero,
    } = req.body;

    let gEdad = grupoEdad;
    let vGenero = genero;

    if (grupoEdad != 1 && grupoEdad != 2 && grupoEdad != 3) gEdad = 1;
    if (genero != 0 && genero != 1) vGenero = 1;

    const testPuntajes = {
        aireLibre,
        mecanica,
        calculo,
        ciencia,
        persuasiva,
        artes,
        linguistica,
        musica,
        social,
        administrativa
    }

    const test = new TestVocacional(testPuntajes);
    
    TestVocacional.calcularCentil(testPuntajes, gEdad, vGenero, (err, data) => {
        if(err){
            res.status(500).send({
                message:
                err.message || "Ocurrio un error al calificar el test."
            });
        } else {
            res.send(data);
        }
    });
};
