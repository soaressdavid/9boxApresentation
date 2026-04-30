const express = require('express');

const app = express();

app.use('/teste', (req, res) => {
    res.status(200).json({ message: 'Teste'});
})

app.listen(3000, () => {
    console.log(`Servidor rodando em https://3000-codeanywhere-templates-j-8ucryxrfm8.app.codeanywhere.com`);
});