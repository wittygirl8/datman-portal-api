const axios = require('axios');

module.exports.validateBankDetails = async (bankDetails,mode = "test") => {
  
    if(mode == "test"){
      //for test environment, simulating error scenario
      //any check done using sortcode 000099 and xxxxxxxx combination will be true and wont be charged
      //any combination apart from that will be charged
      //hence simulating error manually
      if(bankDetails.sortcode != "000099" ){
        return {
          IsCorrect: false
        }
      }

      //check sortcode checker, test mode
      return axios({
        url: 'https://services.postcodeanywhere.co.uk/BankAccountValidation/Interactive/Validate/v2/json3.ws',
        params: {
          "Key": "BK11-ZE74-XR39-YU49",
          "AccountNumber": bankDetails.account_number,
          "SortCode": bankDetails.sortcode
        },
        method:'post',
        
      }).then(response => {
          return response.data.Items[0]
      })
    
    }else if(mode == "live"){
      //check sortcode checker, test mode
      return axios({
        url:'https://api.addressy.com/BankAccountValidation/Batch/Validate/v1.00/json3.ws',
        params: {
          "Key": 'CD74-PM69-ZM11-YD66',
          "AccountNumbers": bankDetails.account_number,
          "SortCodes": bankDetails.sortcode
        },
        method:'post',
        
      }).then(response => {
          return response.data.Items[0]
      })
    }
    
}

// module.exports.accountNumberValidation = async(params) => {
//   try {
      
//     return new Promise((resolve, reject) => {
//       const accountNumbers= params.new_account_number
//       const sortCodes= params.new_sortcode
//       const key = "ME44-RA92-AH67-MJ75"
//       // const key = process.env.account_verification_key

//       var options = {
//           method: 'POST',
//           url: 'https://api.addressy.com/BankAccountValidation/Batch/Validate/v1.00/json3.ws',
//           headers:
//           {
//               'Content-Type': 'application/json'
//           },
//           formData: {
//               "Key":key,
//               "AccountNumbers":accountNumbers,
//               "SortCodes":sortCodes
//           },
//           json: true

//       };
//       /** */

//         //calling loqate api for verification 
//         request(options, function (error, response, body){
            
//             if(body.Items[0].Error){  

//                 console.log("Error",body.Items[0].Error);
//                 return resolve(JSON.stringify(body.Items[0]))       

//             }else if(body.Items[0].IsCorrect){

//                  return resolve("true")

//             }else if(!body.Items[0].IsCorrect){
//                 console.log("Account Information Is incorrect",body.Items[0].IsCorrect);

//                  return resolve("false")

//             }else{

//                 console.log("Error",body.Items[0].Error);
//                 return resolve(JSON.stringify(body.Items[0].Error))  
//             }
//         })
      
//     })
//           // console.log("Account verification: ",body);

//   } catch (error) {
//     console.log("error,error");

//     return resolve(JSON.stringify(error))  

//     //   return error
//   }
// }
