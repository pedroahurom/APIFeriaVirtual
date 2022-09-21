# SERVER FERIA VIRTUAL 2022
El proyecto se desarrollo con el fin de poder proveer a la app móvil de la feria virtual 2022 una API y así poder obtener los datos necesarios para poder mostrar a los futuros aspirantes a la educación superior.
Así como también poder brindar otras funcionalidades como el registro de nuevos aspirantes, poder ingresar con sus cuentas y realizar un test vocacional para poder guiarlos a encontrar una opción adecuada para ellos.

# Herramientas para crear API?
La API se realizó usando nodejs, con el módulo de express para administrar el servidor y el manejo de rutas, como base de datos se utilizó Mysql, ya que esta base de datos es la que se manejó en la página web, debido a esto de utilizo el módulo de mysql para poder conectarse a la base de datos y realizar las consultas.
Se utilizó el modulo de jsdoc para documentar el codigo para posteriores mejoras.
Para testear la API se utilizaron los modulos de jest y supertest [Capacitación para supertest](https://www.youtube.com/watch?v=lZJ1mar_znk&t=1627s "Capacitación para supertest"), estos nos sirven para probar las rutas de la API sin necesidad de hacer las peticiones de manera manual, solo se escribe el codigo una vez y cuando se modifique esa ruta se corre el test y sabremos si algo no funciona de manera correcta.

# Comandos
## npm i
Este comando de debe de ejecutar cuando se descarga/clona el proyecto la primera vez, ya que este es un comando de node para instalar los módulos requeridos para que el servidor funcione de manera correcta.
## npm run dev
El comando se utiliza cuando se está en desarrollo, ya que con este comando se le dice a node que el servidor de ejecuta en un entorno de desarrollo, por lo tanto, node nos proporciona más herramientas de ayuda a la hora de que se esté ejecutando.
## npm run start
Este comando es para cuando se despliegue el servidor en un entorno de producción, ya que este comando permite que el código se ejecute más rápido ya que ignora algunos parámetros de nuestra programación, de igual forma este comando es el que buscan los servicios se alojamiento sin este el servidor nunca estará en línea.
## npm run test
Este comando es para ejecutar los test de la API, no es necesario utilizarlo, solo que se quiere asegurar de que todo esté bien.
## npm run docs
Este comando permite generar toda la documentación hecha en jsdoc, al ejecutar lo, se va a generar una carpeta llamada **docs** en la raíz principal dl proyecto, al nivel de la carpeta **src**, se debe de ingresar a la carpera de **docs** y abrir el archivo **index.html**, con esto tendrá una documentación más detallada de las funciones que se consideraron más importantes a la hora del desarrollo.

# Modelo MVC
Se utilizo el modelo MVC(Modelo Vista Controlador) para desarrollar esta API, se eligió seguir este modelo ya que permite administrar los archivos de una manera más eficiente, su estructura asegura que si el código sigue creciendo y los archivos también, se puede seguir entendiendo ya que al seguir esta estructura se mantiene un código ordenado.

El modelo MVC se utilizó de la siguiente manera:
### Model
Cuando se desea añadir una ruta de una diferente área, primero de debe de crear el modelo, en la carpeta **src/model** con la siguiente estructura **nombreArchivo.model.js**, se hace con el fin de identificar a que area pertenece cada tipo de archivo.
Si este modelo necesita conexión a la base de datos entonces se le añade esta línea de código para que utilice el modelo que se encarga de conectar a la base de datos:
**const pool = require('./connectDatabase');**.

Esta es la estructura que debe de tener el código de cada modelo.

     const pool = require('./connectDatabase'); 
    
    const Universidad = function () {
     }
    
     Universidad.getAll = (result) => {
     };
    
    module.exports = Universidad;
	

Para realizar una consulta, se realiza de la siguiente manera:
    
    let query = "Consulta";
    
    pool.query(query, (err, res) => {
                 if (err) {
                     console.log("error: ", err);
                     result({ message: "Ocurrio un error" }, null);
                     return;
                 }
     
                 if (Object.entries(res).length === 0) {
                     result(null, { message: "No existe ese dato" });
                     return;
                 }
     
                 result(null, res);
    });

Se crea una variable llamada query y ahí se añade la consulta sql.
Posteriormente se llama a pool.query y se añade la variable query como se muestra, se hacen una validaciones básicas para que si un dato no existe en la base de datos, el servidor no se caiga.
Se devuelven los datos en el callback result, esto se hace asi ya que el controlador se lo solicita de esta manera.

### Controlador
Una vez creado el modelo, se crea el controlador este se encarga administrar los datos requeridos por las vistas.
Se tiene que crear un archivo llamado **nombreArchivo.controller.js** en la ruta **src/controller/**, este archivo debe de importar el modelo creado anteriormente, se exporta de la siguiente manera: 
**const nombreArchivo = require('../model/nombreArchivo.model');**
con esto ya se pueden utilizar las funciones creadas en el modelo en el controlador.

    const Universidad = require('../model/universidad.model');
    
    exports.findAll = (req, res) => {
      Universidad.getAll((err, data) => {
        if (err)
          res.status(500).send({
            message: "Ocurrio un error al obtener los datos"
          });
        else {
          res.send(data);
        }
      });
    };

Para crear las funciones del controlador se utiliza esa estructura y dentro de la función se llaman las funciones del modelo requeridos.
Con **res.Status(codigo).send(message)** se envía el **Código** HTTP y el mensaje o los datos obtenidos de la base de datos.
**res.send(data)** envía los datos obtenidos del modelo si todo va bien.

### Ruta
Para poder añadir una ruta y utilizar las funciones del controlador, se crea una archivo en la ruta **src/routes** con el nombre **nombreArchivo.routes.js**, dentro de este archivo de debe de importar el controlador
` const universidad = require('../controller/universidad.controller');`
y el enrutador de express 
`var router = require("express").Router();`.
Una vez hecho esto se añade **router."metodoHTTP"("URL", funcionControlador)**

     const universidad = require('../controller/universidad.controller');
    
     var router = require("express").Router();
     
    router.get("/", universidad.findAll);
    
    module.exports = router;

Para finalizar este archivo se debe de importar en el archivo **src/routes/index.routes.js**.

    const universidadRouter = require('./universidad.routes');
    
    function routerApi(app) {
        app.use('/v1/universidad', universidadRouter);
    }
    
    module.exports = routerApi;

# Conexión a la base de datos
## Credenciales
La conexión a la base de datos necesita de las credenciales de conexión, estas se encuntran en el archivo **src/config/db.config.js** aqui es donde se tiene que modificar para poder conectarse a la base de datos deseada.

    module.exports = {
        /**
         * Configuración para establecer la conexión con la base de datos.
         * @name configDbCredentials
         * @type {Object}
         * @property {String} host - Dirección del servidor
         * @property {String} port - Puerto del servidor
         * @property {String} user - Usuario de la base de datos
         * @property {String} password - Contraseña del usuario
         * @property {String} database - Nombre de la base de datos
         */
        database: {
            host: 'sql3.freemysqlhosting.net',
            port: '3306',
            user: 'sql3511638',
            password: '121PRuUfKh',
            database: 'sql3511638'
        }
    };

