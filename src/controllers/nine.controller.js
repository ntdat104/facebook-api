const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");

const User = require("../models/user.model.js");
const Version = require("../models/user.model.js");

const statusCode = require("../constants/statusCode.constant.js");
const statusMessage = require("../constants/statusMessage.constant.js");
const md5 = require("md5");

const setBlock = async (req, res) => {
  let { token, user_id, type } = req.query;
  const { _id } = req.userDataPass;

  try {
    type=Number(type);
    //kiểm tra tham số đầu vào
    if (user_id == _id || (type != 0 && type != 1)) {
      console.log("trùng user_id hoặc type không đúng");
      throw Error("params");
    }
    // tìm user bị block
    var friendData = await User.findById(user_id);
    if (!friendData || friendData.is_blocked) {
      console.log("friend không tìm thấy hoặc đã bị server block");
      throw Error("action");
    }
    // OK
    var userData = req.userDataPass;
    var isBlocked = userData.blockedIds.includes(user_id);
    if (type == 0 && isBlocked) {
      //block và đã block r
      throw Error("blockedbefore");
    }
    if (type == 0 && !isBlocked) {
      await User.findByIdAndUpdate(_id, {
        $push: {
          blockedIds: user_id,
        },
        $pull: {
          friends: user_id,
          sendRequestedFriends: {
            receiver: user_id,
          },
          requestedFriends: {
            author: user_id,
          },
        },
      });
      await User.findByIdAndUpdate(user_id, {
        $pull: {
          friends: _id,
          sendRequestedFriends: {
            receiver: _id,
          },
          requestedFriends: {
            author: _id,
          },
        },
      });
      return res.status(200).json({
        code: statusCode.OK,
        message: statusMessage.OK,
      });
    }
    if (type == 1 && !isBlocked) {
      // unblock và chưa block
      throw Error("unblockedbefore");
    }
    if (type == 1 && isBlocked) {
      await User.findByIdAndUpdate(_id, {
        $pull: {
          blockedIds: user_id,
        },
      });
      return res.status(200).json({
        code: statusCode.OK,
        message: statusMessage.OK,
      });
    }
  } catch (error) {
    if (error.massage == "params") {
      return res.status(500).json({
        code: statusCode.PARAMETER_VALUE_IS_INVALID,
        message: statusMessage.PARAMETER_VALUE_IS_INVALID,
      });
    } else if (
      error.massage == "blockedbefore" ||
      error.message == "unblockedbefore"
    ) {
      return res.status(500).json({
        code: statusCode.ACTION_HAS_BEEN_DONE_PREVIOUSLY_BY_THIS_USER,
        message: statusMessage.ACTION_HAS_BEEN_DONE_PREVIOUSLY_BY_THIS_USER,
      });
    } else if (error.massage == "action") {
      return res.status(500).json({
        code: statusCode.ACTION_HAS_BEEN_DONE_PREVIOUSLY_BY_THIS_USER,
        message: statusMessage.ACTION_HAS_BEEN_DONE_PREVIOUSLY_BY_THIS_USER,
      });
    } else {
      return res.status(500).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR,
      });
    }
  }
};

const change_password = async (req, res) => {
  let { password, new_password } = req.query;
  const { _id } = req.userDataPass;
  try {
    const user = req.userDataPass;
    if (
      !new_password ||
      new_password.length < 6 ||
      new_password.length > 10 ||
      new_password.match(/[^a-z|A-Z|0-9]/g)
    )
      throw Error("NEW_PASSWORD_VALUE_IS_INVALID");

    if (password == new_password) throw Error("PARAMETER_VALUE_IS_INVALID");

    let count = 0;
    // chưa check xâu con chung dài nhất 80%

    password = md5(password);
    if (password != user.password) throw Error("OLD_PASSWORD_VALUE_IS_INVALID");

    //đã thoả mãn các điều kiện

    new_password = md5(new_password);
    user.password = new_password;
    await user.save();

    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
    });
  } catch (error) {
    console.log(error.message);
    if (error.message == "PARAMETER_VALUE_IS_INVALID")
      return res.status(200).json({
        code: statusCode.PARAMETER_VALUE_IS_INVALID,
        message: statusMessage.PARAMETER_VALUE_IS_INVALID,
      });
    else if (error.message == "OLD_PASSWORD_VALUE_IS_INVALID")
      return res.status(200).json({
        code: statusCode.PARAMETER_VALUE_IS_INVALID,
        message: "OLD_PASSWORD_VALUE_IS_INVALID",
      });
    else if (error.message == "NEW_PASSWORD_VALUE_IS_INVALID")
      return res.status(200).json({
        code: statusCode.PARAMETER_VALUE_IS_INVALID,
        message: "NEW_PASSWORD_VALUE_IS_INVALID",
      });
    else
      return res.status(200).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR,
      });
  }
};

const getPushSettings = async (req, res) => {
  // const { token } = req.query;
  const { _id } = req.userDataPass;
  try {
    var userData = req.userDataPass;
    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data: userData.settings,
    });
  } catch (error) {
    if (error.massage == "") {
      return res.status(500).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR,
      });
    } else {
      return res.status(500).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR,
      });
    }
  }
};

const setPushSettings = async (req, res) => {
  const {
    token,
    like_comment,
    from_friends,
    requested_friend,
    suggested_friend,
    birthday,
    video,
    report,
    sound_on,
    notification_on,
    vibrant_on,
    led_on,
  } = req.query;
  const { _id } = req.userDataPass;
  try {
    if (
      like_comment == undefined &&
      from_friends == undefined &&
      requested_friend == undefined &&
      suggested_friend == undefined &&
      birthday == undefined &&
      video == undefined &&
      report == undefined &&
      sound_on == undefined &&
      notification_on == undefined &&
      vibrant_on == undefined &&
      led_on == undefined
    ) {
      throw Error("params");
    }
    var userData = req.userDataPass;
    userData.settings.like_comment =
      like_comment == "0" || like_comment == "1"
        ? like_comment
        : userData.settings.like_comment;
    userData.settings.from_friends =
      from_friends == "0" || from_friends == "1"
        ? from_friends
        : userData.settings.from_friends;
    userData.settings.requested_friend =
      requested_friend == "0" || requested_friend == "1"
        ? requested_friend
        : userData.settings.requested_friend;
    userData.settings.suggested_friend =
      suggested_friend == "0" || suggested_friend == "1"
        ? suggested_friend
        : userData.settings.suggested_friend;
    userData.settings.birthday =
      birthday == "0" || birthday == "1"
        ? birthday
        : userData.settings.birthday;
    userData.settings.video =
      video == "0" || video == "1" ? video : userData.settings.video;
    userData.settings.report =
      report == "0" || report == "1" ? report : userData.settings.report;
    userData.settings.sound_on =
      sound_on == "0" || sound_on == "1"
        ? sound_on
        : userData.settings.sound_on;
    userData.settings.notification_on =
      notification_on == "0" || notification_on == "1"
        ? notification_on
        : userData.settings.notification_on;
    userData.settings.vibrant_on =
      vibrant_on == "0" || vibrant_on == "1"
        ? vibrant_on
        : userData.settings.vibrant_on;
    userData.settings.led_on =
      led_on == "0" || led_on == "1" ? led_on : userData.settings.led_on;
    var result = await userData.save();

    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data: result.settings,
    });
  } catch (error) {
    if (error.massage == "params") {
      return res.status(500).json({
        code: statusCode.PARAMETER_VALUE_IS_INVALID,
        message: statusMessage.PARAMETER_VALUE_IS_INVALID,
      });
    } else {
      return res.status(500).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR,
      });
    }
  }
};

const checkNewVersion = async (req, res)=>{
  const {token, last_update}= req.query;
  const {_id}= req.userDataPass;
  try {
    if (!last_update) {
      throw Error("params")
    }
    var versionData = await Version.find({}).sort({created: 1});


    return res.status(200).json({
      code: statusCode.OK,
      message: statusMessage.OK,
      data:{
        version: versionData[0],
        user:{
          id: _id,
          _id: _id,
        },
        badge: "thong bao chua doc",
        unread_message: "tin nhan chua doc",
        now: "chi so phien ban"
      }
    })
    
  } catch (error) {
    if (error.message=="params") {
      return res.status(200).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR
      })
    } else {
      return res.status(200).json({
        code: statusCode.UNKNOWN_ERROR,
        message: statusMessage.UNKNOWN_ERROR
      })
    }
  }
}

module.exports = {
  change_password: change_password,
  setBlock,
  getPushSettings,
  setPushSettings,
  checkNewVersion,
};
