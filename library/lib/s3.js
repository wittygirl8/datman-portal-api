const crypto = require('crypto')
const AWS = require('aws-sdk')

const UPLOAD_SIGNED_URL_EXPIRE = 60 * 20 // 2 minutes
const VIEW_SIGNED_URL_EXPIRE = 60 * 1 // 2 minutes
const CLIENT_ACCOUNTS_PROOF_BUCKET = 'verify.datman.je'
const SUB_FOLDER_SALT = process.env.SUB_FOLDER_SALT //Fort Knox Passwords
const filesNames = ['bank_document', 'id', 'account_verify', 'all']
const awsKeys = JSON.parse(process.env.PROD_S3_CRED)

module.exports.isFileTagValid = (key) => {
    return filesNames.includes(key)
}

module.exports.getSignedUrl = (merchantId, tag, operation) => {
    let exp = VIEW_SIGNED_URL_EXPIRE
    let s3ParamsKey;
    if (operation === 'putObject') {
        exp = UPLOAD_SIGNED_URL_EXPIRE
    }

    let hashedMerchantId = crypto.createHmac('sha256', SUB_FOLDER_SALT).update(merchantId.toString()).digest('hex')
    let hashedFileSuffix = crypto.createHmac('sha256', Math.random().toString()).update(Math.random().toString()).digest('hex')

    let s3 = new AWS.S3({
        accessKeyId: awsKeys.ak,
        secretAccessKey: awsKeys.sk,
        signatureVersion: 'v4'
    });

    if (operation === 'putObject') {
        s3ParamsKey = `${hashedMerchantId}/${tag}_${hashedFileSuffix}`
    }
    else {
        s3ParamsKey = tag
    }
    console.log('tota kae', s3ParamsKey)
    let url = s3.getSignedUrl(operation, {
        Bucket: CLIENT_ACCOUNTS_PROOF_BUCKET,
        Key: s3ParamsKey,
        Expires: exp,
    });
    return url
}

module.exports.listKeys = (merchantId, tag) => {
    // let hashedMerchantId = crypto.createHmac('sha256', SUB_FOLDER_SALT).update(merchantId.toString()).digest('hex')
    let hashedMerchantId = merchantId
    var params = {
        Bucket: CLIENT_ACCOUNTS_PROOF_BUCKET,
        MaxKeys: 200,
        Prefix: tag !== 'all' ? `${hashedMerchantId}/${tag}_` : `${hashedMerchantId}/`,
    };
    let s3 = new AWS.S3({
        accessKeyId: awsKeys.ak,
        secretAccessKey: awsKeys.sk,
        signatureVersion: 'v4'
    });

    return new Promise((resolve, reject) => {
        s3.listObjectsV2(params, (err, data) => {
            if (err) {
                reject(err)
            }
            try {
                resolve(data.Contents)
            }
            catch (e) {
                reject(e)
            }
        })
    })
}