var config = require('../../config')
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var util = require('../../utils/util.js')
var api = require('../../utils/api.js')
var QQMapWX = require('../../vendor/qqmap-wx-jssdk.min.js')
var qqmapsdk
Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgUrl: '',
    step: 0,
    speed: 0,
    resultFlag: false,
    retryFlag: false,
    refImgList: [],
    recommendPic: [],
    tempPhotoPath: '',
    faceCardId: '',
    index: 0,
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
    var that = this;
    that.setData({
      tempPhotoPath: getApp().globalData.tempPhotoPath,
      index: parseInt(Math.random() * 20)
    })
    util.showBusy('正在测算')
    this.setData({
      imgUrl: options.imgUrl
      // imgUrl: '/public/upload/wep/photos/img20180705163127.png'
    })

    if(options.faceCardId){
      this.setData({
        faceCardId: options.faceCardId,
        retryFlag: true
      })

      api.get({
        url: 'https://www.facecardpro.com/wep/faceCard/getOne',
        method: 'GET',
        data: {
          faceCardId: that.data.faceCardId
        },
        success(result) {
          that.setData({
            faceCard: result.data.faceCard
          });
          that.getRecommendPic();
        },
        fail(err) {
          util.showError('保存失败')
        }
      });

    }else {
      api.get({
        url: 'https://www.facecardpro.com/wep/startAipFace',
        method: 'POST',
        data: {
          path: that.data.imgUrl
        },
        success(result) {
          var info = result.data.info[0]
          var faceCardResult = {
            age: info.age,
            yaw: info.angle.yaw,
            pitch: info.angle.pitch,
            roll: info.angle.roll,
            beauty: info.beauty,
            expression: info.expression.type,
            face_probability: info.face_probability,
            face_shape: info.face_shape.type,
            face_token: info.face_token,
            gender: info.gender.type,
            glasses: info.glasses.type,
            landmark: JSON.stringify(info.landmark),
            landmark72: JSON.stringify(info.landmark72),
            location: JSON.stringify(info.location),
            race: info.race.type,
            street: info.street,
            district: info.district
          }

          that.setData({
            faceCard: faceCardResult
          })
          qqmapsdk = new QQMapWX({
            key: 'DU3BZ-YRT6P-JRYDT-VTWGK-LRH2F-5MBFD'
          });
          wx.getLocation({
            type: 'gcj02',
            success: function (res) {
              console.log(res);
              qqmapsdk.reverseGeocoder({
                location: {
                  latitude: res.latitude,
                  longitude: res.longitude
                },
                success: function (addressRes) {
                  var district = 'faceCard.district'
                  var street = 'faceCard.street'
                  var city = 'faceCard.city'
                  that.setData({
                    [district]: addressRes.result.address_component.district,
                    [street]: addressRes.result.address_component.street,
                    [city]: addressRes.result.address_component.city
                  })
                  that.getRecommendPic();
                }
              })
            },
            fail: function (err) {
              util.showBusy('获取地址错误')
            }
          })
        },
        fail(err) {
          console.error('登录失败，可能是网络错误或者服务器发生异常')
        }
      });
    }
    
  },

  retry: function () {
    var that = this;
    var query = wx.createSelectorQuery();
    query.select('.ani-holder').boundingClientRect()
    query.exec(function (res) {
      var step = parseFloat('-' + res[0].height)
      that.setData({
        index: (++that.data.index) % 20
      })
      that.animationData.translateY(that.data.index * step).step({
        duration: 1000
      });
      that.setData({
        animationData: that.animationData.export()
      })
    })
  },



  getRecommendPic: function () {
    var that = this;
    var list = [];
    var resultList = [];
    api.get({
      url: 'https://www.facecardpro.com/wep/star/getAll',
      method: 'GET',
      data: {
        gender: that.data.faceCard.gender,
        faceShape: that.data.faceCard.face_shape,
        yaw: that.data.faceCard.yaw + 3,
        yawMinus: that.data.faceCard.yaw - 3
      },
      success(result) {
        util.showSuccess('测算结束')
        result.data.list.forEach(function (res) {
          list.push({
            src: res.src,
            name: res.name,
            id: res.id
          })
          if (list.length < 4) {
            resultList.push(res.src)
          }
        })
        var i = 0;
        while (list.length < 20) {
          list.push(list[i])
          i++;
        }

        var query = wx.createSelectorQuery();
        query.select('.ani-holder').boundingClientRect()
        query.exec(function (res) {
          var step = parseFloat('-' + res[0].height)
          that.animationData = wx.createAnimation();
          that.animationData.translateY(that.data.index * step).step({
            duration: 1000
          });
          that.setData({
            animationData: that.animationData.export()
          })
        })
        that.setData({
          refImgList: list
        })
        var recommendPic = 'faceCard.recommendPic'
        var star = 'faceCard.star'
        var facePhoto = 'faceCard.facePhoto'
        that.setData({
          [facePhoto]: that.data.imgUrl,
          [star]: that.data.refImgList[0] ? that.data.refImgList[that.data.index].id : '',
          [recommendPic]: resultList
        })

        if (!that.data.faceCardId){
          that.saveFaceCard();
        } else {
          that.backAni();
        }

        
      },
      fail(err) {
        console.error('登录失败，可能是网络错误或者服务器发生异常')
      }
    });
  },

  backAni: function () {
    var that = this;
    setTimeout(function () {
      var query = wx.createSelectorQuery();
      query.select('.pic-holder').boundingClientRect()
      query.exec(function (res) {

        var animation = wx.createAnimation({
          duration: 1000,
        })
        var step = parseFloat('-' + res[0].top)
        animation.translateY(step).step();
        that.setData({
          animationPicData: animation.export()
        })
      })

      query.select('.cover').boundingClientRect()
      query.exec(function (res) {
        var animation = wx.createAnimation({
          duration: 1000,
        })
        animation.opacity(0).step();
        that.setData({
          coverAnimation: animation.export()
        })
      })
    }, 1000);

    setTimeout(function () {
      that.setData({
        resultFlag: true
      })
    }, 2000)

  },


  updateFaceCard: function () {
    var that = this;
    var star = 'faceCard.star'
    console.log(that.data.refImgList[that.data.index].name)
    that.setData({
      [star]: that.data.refImgList[0] ? that.data.refImgList[that.data.index].id : '',
    })

    api.get({
      url: 'https://www.facecardpro.com/wep/faceCard/updateOne',
      method: 'POST',
      data: that.data.faceCard,
      success(result) {
        util.showSuccess('更新成功')
      },
      fail(err) {
        util.showError('保存失败')
      }
    })
  },

  





  saveFaceCard: function () {
    var that = this;
    api.get({
      url: 'https://www.facecardpro.com/wep/faceCard/addOne',
      method: 'POST',
      data: that.data.faceCard,
      success(result) {
        that.setData({
          faceCardId: result.data.data.id
        })
        
        setTimeout(function () {
          var query = wx.createSelectorQuery();
          query.select('.pic-holder').boundingClientRect()
          query.exec(function (res) {

            var animation = wx.createAnimation({
              duration: 1000,
            })
            var step = parseFloat('-' + res[0].top)
            animation.translateY(step).step();
            that.setData({
              animationPicData: animation.export()
            })
          })

          query.select('.cover').boundingClientRect()
          query.exec(function (res) {
            var animation = wx.createAnimation({
              duration: 1000,
            })
            animation.opacity(0).step();
            that.setData({
              coverAnimation: animation.export()
            })
          })
        }, 1000);

        setTimeout(function () {
          that.setData({
            resultFlag: true
          })
        }, 2000)
      },
      fail(err) {
        util.showError('保存失败')
      }
    })
  },

  onShareAppMessage: function () {
    var faceCardId = this.data.faceCardId;
    if (!faceCardId) {
      console.log('请先保存')
    } else {
      return {
        title: '脸卡',
        path: '/pages/faceCardCreateShare/faceCardCreateShare?faceCardId=' + faceCardId,
        success: (res) => {
          console.log("转发成功", res);
        },
        fail: (res) => {
          console.log("转发失败", res);
        }
      }
    }
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

  share: function () {
    this.updateFaceCard()
  }
})