const config = require("../config");
const { STORAGE_KEYS, getStorage } = require("./storage");

function normalize(value) {
  return (value || "").toString().trim();
}

function getAdminWhitelist() {
  const settings = getStorage(STORAGE_KEYS.SETTINGS, {});
  const configList = config.adminWhitelist || {};
  const override = settings.adminWhitelist || {};
  return {
    userIds: [...(configList.userIds || []), ...(override.userIds || [])],
    phones: [...(configList.phones || []), ...(override.phones || [])],
    wechatNames: [
      ...(configList.wechatNames || []),
      ...(override.wechatNames || [])
    ]
  };
}

function isAdminAllowed(profile) {
  const whitelist = getAdminWhitelist();
  const userId = normalize(profile.userId);
  const phone = normalize(profile.contact);
  const wechatName = normalize(profile.wechatNick);
  if (userId && whitelist.userIds.includes(userId)) return true;
  if (phone && whitelist.phones.includes(phone)) return true;
  if (wechatName && whitelist.wechatNames.includes(wechatName)) return true;
  return false;
}

module.exports = {
  getAdminWhitelist,
  isAdminAllowed
};
