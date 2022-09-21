const mysql = require('mysql');

const { database } = require('../config/db.config');

const pool = mysql.createPool(database);

/**
 * @name connectDatabase
 * @description Función que permite conectar con la base de datos.
 * @param {Function} callback - Función que se ejecuta cuando la conexión con la base de datos se establece.
 * @returns {Object} - Objeto con la conexión con la base de datos.
 */
pool.getConnection((err, connection) => {
    if(err){
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            console.error('DATABASE CONNETION WAS CLOSED');
        }
        if(err.code === 'ER_CON_COUNT_ERROR'){
            console.error('DATABASE HAS TO MANY CONNECTIONS');
        }
        if(err.code === 'ECONNREFUSED'){
            console.error('DATABASE CONNETION WAS REFUSED');
        }
    }
    
    if (connection){
        connection.release();
        console.log('DB is Connected');
    } 
    return;
});

module.exports = pool;