const errorHandler = (err, req, res, next) => {
    console.error('Erro', err);

    if (err.isOperational) {
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

    if (err.code === 'P2025') {
        return res.status(400).json({
            success: false,
            message: 'Registro mão encontrado.'
        });
    }

    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            message: err.details[0].message
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Errro interno do servidor'
    });
};

export default errorHandler;