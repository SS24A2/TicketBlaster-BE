const checkRole = (req, res, next) => {
    if (req.headers.role !== "admin") {
        return res.status(401).send({ error: "Unauthorized!!!" })
    } else {
        next()
    }
}

module.exports = checkRole
