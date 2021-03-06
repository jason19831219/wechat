var config = require('../../config')
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var util = require('../../utils/util.js')
var api = require('../../utils/api.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    faceCardId: '',
    faceCard: {},
    recommendFlag: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    this.setData({
      faceCardId: options.faceCardId
      // faceCardId: 'r1eAS4QNQ'
    })

    if (options.recommendFlag) {
      this.setData({
        recommendFlag: true
      })
    }


    var that = this;
    // api.get({
    //   url: 'https://www.facecardpro.com/wep/faceCard/getOne',
    //   method: 'GET',
    //   data: {
    //     faceCardId: that.data.faceCardId
    //   },
    //   success(result) {
    //     that.setData({
    //       faceCard: result.data.faceCard
    //     });
    //   },
    //   fail(err) {
    //     util.showError('保存失败')
    //   }
    // });

    wx.request({
      url: 'https://www.facecardpro.com/wep/faceCard/getOne',
      method: 'GET',
      data: {
        faceCardId: that.data.faceCardId
      },
      success(result) {
        that.setData({
          faceCard: result.data.faceCard
        });
      },
      fail(err) {
        util.showError('获取失败')
      }
    })
  },

  getNext: function () {
    var that = this;
    api.get({
      url: 'https://www.facecardpro.com/wep/faceCard/findRandomOne',
      method: 'GET',
      data: {
        gender: that.data.faceCard.gender,
        faceShape: that.data.faceCard.face_shape,
        yaw: that.data.faceCard.yaw + 3,
        yawMinus: that.data.faceCard.yaw - 3
      },
      success(result) {
        console.log(result)
        wx.navigateTo({
          url: '/pages/faceCardShare/faceCardShare?faceCardId=' + result.data.faceCard + '&recommendFlag=true',
        })
      },
      fail(err) {
        console.error('登录失败，可能是网络错误或者服务器发生异常')
      }
    });
  },

  bindGetUserInfo: function (e) {
    const session = qcloud.getSession()
    if (session) {
      qcloud.loginWithCode({
        success: res => {
          this.setData({
            userInfo: res,
            logged: true
          })
          this.doCollection();
        },
        fail: err => {
          console.error(err)
          util.showModel('登录错误', err.message)
        }
      })
    } else {
      util.showBusy('正在登录')
      qcloud.login({
        success: res => {
          this.setData({
            userInfo: res,
            logged: true
          })
          util.showSuccess('登录成功')
          this.doCollection();
        },
        fail: err => {
          console.error(err)
          util.showModel('登录错误', err.message)
        }
      })
    }
  },

  doCollection: function () {
    var that = this;
    api.get({
      url: 'https://www.facecardpro.com/wep/collection/addOne',
      method: 'POST',
      data: {
        faceCardId: that.data.faceCardId
      },
      success(result) {
        api.get({
          url: 'https://www.facecardpro.com/wep/faceCard/updateLikeNum',
          method: 'GET',
          data: {
            faceCardId: that.data.faceCardId
          },
          success(result) {
            util.showSuccess('收藏成功')
          },
          fail(err) {
            util.showError('收藏失败')
          }
        });

      },
      fail(err) {
        util.showError('收藏失败')
      }
    });
  },

  imgPreview: function (e) {
    var src = e.currentTarget.dataset.src;
    var imgList = Array();
    var list = e.currentTarget.dataset.list
    list.forEach(function (res) {
      console.log(res);
      imgList.push('https://www.facecardpro.com' + res)
    })

    wx.previewImage({
      current: src,
      urls: imgList
    })
  },

  goBack: function () {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onShareAppMessage: function () {
    var faceCardId = this.data.faceCardId;
    return {
      title: '脸卡',
      path: '/pages/faceCardShare/faceCardShare?faceCardId=' + faceCardId,
      success: (res) => {
        console.log("转发成功", res);
      },
      fail: (res) => {
        console.log("转发失败", res);
      }
    }
  },
})