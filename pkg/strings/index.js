const generateFileName = (nameLength) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let name = ""
    for (let i = 0; i < nameLength; i++) {
        let charIndex = Math.floor(Math.random() * chars.length)
        name = name.concat(chars[charIndex])
    }
    return name
}

module.exports = generateFileName
