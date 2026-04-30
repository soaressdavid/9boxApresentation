const errorHandler = (err, req, res, next) => {
    console.error('Erro', err);

    if (err.isOperacional) {
        return res.status(err.statusCode).json({
            seccess: false,
            message: err.message
        });
    }

    if (err.code === 'P2002'){
        return res.status(400).json({
            success: false,
            message: 'Já existe um registro com esses dados'
        });
    }
}