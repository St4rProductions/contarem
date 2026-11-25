const express = require("express");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 25565;

// Security headers; allow only the pre-paint preference script inline.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            scriptSrc: ["'self'", "'sha256-bkxJcHopyXlTIaTVyxGrwN/ft7zXCQU/dGeHxHgi3U8='"]
        }
    }
}));

// Compression middleware
app.use(compression());

// Revalidate site files and cache image assets as immutable for one year.
app.use(express.static(path.join(__dirname, "public"), {
    maxAge: 0,
    etag: true,
    setHeaders(res, filePath) {
        const imageDirectory = `${path.join(__dirname, "public", "images")}${path.sep}`;
        if (filePath.toLowerCase().startsWith(imageDirectory.toLowerCase())) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
    }
}));

// Abre a home do site sempre na seção Início
app.get("/", (req, res) => {
    res.redirect("/#home");
});

app.get("/index.html", (req, res) => {
    res.redirect("/#home");
});

app.get("/atividade-pintura.html", (req, res) => {
    res.redirect("/#pintura");
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// 404 handler
app.use((req, res) => {
    res.status(404).send("Page not found");
});

// Escuta em todos os IPs da máquina legal
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor iniciado!`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Rede: http://SEU_IP:${PORT}`);
});