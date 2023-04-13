const MypayCsTerminalIds = require('../../database/model/mypay_cs_terminal_ids');
const MypayUsersCardstreamSettings = require('../../database/model/mypay_users_cardstream_settings');


module.exports.getTid = (params) => {
  return MypayCsTerminalIds.findOne({
      where: params,
      raw: true
    }
  );
};

module.exports.updateTid = (params) =>{
  return MypayCsTerminalIds.update(params,
    {
      where: { tid: params.terminal_id, }
    });
};

module.exports.seedUsersCardstreamSettings = (params) => {
  return MypayUsersCardstreamSettings.upsert(params);
}