var config = require('../../config')
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var util = require('../../utils/util.js')
var api = require('../../utils/api.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgUrl: '',
    step: 0,
    speed: 0,
    refImgList: [],
    recommendPic: [],
    index: 0,
    faceCardId: '',
    faceCard: {},
    faceSharpItems: [
      { name: 'square', value: '正方形', src: 'https://www.facecardpro.com/public/wximg/square.png' },
      { name: 'triangle', value: '三角形', src: 'https://www.facecardpro.com/public/wximg/triangle.png' },
      { name: 'oval', value: '椭圆', src: 'https://www.facecardpro.com/public/wximg/oval.png' },
      { name: 'heart', value: '心形', src: 'https://www.facecardpro.com/public/wximg/heart.png' },
      { name: 'round', value: '圆形', src: 'https://www.facecardpro.com/public/wximg/round.png' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      faceCardId: options.faceCardId
      // faceCardId: 'r1eAS4QNQ'
    })
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

  onShareAppMessage: (res) => {
    return {
      title: '脸卡',
      path: '/pages/faceCardCreateShare/faceCardCreateShare?faceCardId=' + id,
      success: (res) => {
        console.log("转发成功", res);
      },
      fail: (res) => {
        console.log("转发失败", res);
      }
    }
  }
})