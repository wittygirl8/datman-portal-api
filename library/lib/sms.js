const request = require("request");

/**
 * Send the new password via sms via Reach API
 * @param {string} phone
 * @param {Object} business_details
 * @param {string} pass
 */
module.exports.sendSms = (phone, business_details, pass) => {

    return new Promise((resolve, reject) => {
        let reachCredentials =JSON.parse(process.env.PROD_REACH_SMS)
        var options = {
            method: 'POST',
            url: 'http://api.reach-interactive.com/sms/message',
            headers:
            {
                'Content-Type': 'application/json',
                username: reachCredentials.username,
                password: reachCredentials.password
            },
            body:
            {
                to: phone,
                from: 'DATMAN',
                // message: `Your temporary password for Datman is ${pass}   To login please visit https://datmancrm.com`
                message: `Your temporary password is ${pass}   To login please visit https://datmancrm.com/`
            },
            json: true
        };

        request(options, function (error, response, body) {

            console.log("send sms body", body);
            // During error the body will be {Success : false. description : "balablabla"} -> no array
            // During success the body will be [{Success : false. description : "balablabla"}] -> array inclosed
            if (error) throw new Error(error);

            try{
                let { Success, Id, Description } = body[0]
                console.log('syccess', Success, Description)
                if (Success === true && Id != null) {
                    return resolve({ Id })
                }
    
                reject({ Description })
            }
            catch(e)
            {
                reject(e)
            }        
        });

    })
}


//code written by Gaurav
module.exports.sendSms1 = params => {
    return new Promise((resolve, reject) => {
      // let reachCredentials =JSON.parse(process.env.PROD_REACH_SMS)
  
      var options = {
        method: "POST",
        url: "http://api.reach-interactive.com/sms/message",
        headers: {
          "Content-Type": "application/json",
          username: "touch2s",
          password: "touch8923"
        },
        body: {
          to: params.to,
          from: params.from,
          message: params.message
        },
        json: true
      };
      console.log("options", options);
  
      request(options, function(error, response, body) {
        console.log("send sms body", body);
        // During error the body will be {Success : false. description : "balablabla"} -> no array
        // During success the body will be [{Success : false. description : "balablabla"}] -> array inclosed
        if (error) throw new Error(error);
  
        try {
          let { Success, Id, Description } = body[0];
          console.log("syccess", Success, Description);
          if (Success === true && Id != null) {
            return resolve({ Id });
          }
  
          reject({ Description });
        } catch (e) {
          reject(e);
        }
      });
    });
  };