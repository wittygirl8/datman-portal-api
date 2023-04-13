const crypto = require('crypto');

/**
 * example
 * expected password=sectet
 * value=P{PROVIDER_ID}U{USER_ID}T{TYPE}
 * 
 */

module.exports.encrypt = (password, value) => {
    const algorithm = 'aes-192-cbc';
    // const password = 'secret';
    const key = crypto.scryptSync(password, 'salt', 24);
    const iv = Buffer.alloc(16, 0); // Initialization vector.

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    console.log(encrypted);
    return encrypted
}

module.exports.decrypt = (password, encryptedData) => {

    const algorithm = 'aes-192-cbc';
    // const password = 'Password used to generate key';
    // Use the async `crypto.scrypt()` instead.
    const key = crypto.scryptSync(password, 'salt', 24);
    // The IV is usually passed along with the ciphertext.
    const iv = Buffer.alloc(16, 0); // Initialization vector.

    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    // Encrypted using same algorithm, key and iv.
    // const encrypted =
    //   'e5f79c5915c02171eec6b212d5520d44480993d7d622a7c4c2da32f6efda0ffa';
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    console.log(decrypted);
    return decrypted;
    // Prints: some clear text data

}