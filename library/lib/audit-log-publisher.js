const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

module.exports.auditLogsPublisher = async (args) => {
  try {
    let options = {};
    const { queueUrl, data } = args;
    if (process.env.IS_OFFLINE) {
      options = {
        apiVersion: "2012-11-05",
        region: "localhost",
        endpoint: "http://0.0.0.0:9324",
        sslEnabled: false,
      };
    }
    const sqs = new AWS.SQS(options);
    const params = {
      MessageGroupId: uuidv4(),
      MessageBody: JSON.stringify(data),
      QueueUrl: queueUrl,
    };

    const res = await sqs.sendMessage(params).promise();
    console.log(res);
  } catch (error) {
    console.log(error);
  }
};
