const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            AbortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(500).json({
                success: false,
                message: error.details[0].message,
                errors: error.details.map(d => d.message)
            });
        }


        req.body = value;
        next();
    };
};

export default validate;