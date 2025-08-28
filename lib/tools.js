const uploadMessages = ["Listo padrecito.", "Listo pá.", "Jamón del medio, tío.", "Todo liso, fiera.", "Todo regio, titán."];

function randomUploadMessage() {
    return uploadMessages[Math.floor(Math.random() * uploadMessages.length)];
}


module.exports = { randomUploadMessage }