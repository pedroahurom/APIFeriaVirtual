const Users = require('../model/usuarios.model');

exports.getUserData = (req, res) => {
    try {
        Users.findByIdGet(req.user, (err, data) => {
            if (err) {
                res.status(500).send({
                    error: err.message || 'Intenta de nuevo mas tarde'
                })
            } else {
                res.status(200).json({...data._doc, token: req.token});
            }
        }); 
    } catch (err) {
        res.status(500).json('Intenta de nuevo más tarde');
    }
}