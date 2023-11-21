<template>
  <div id="app">
    <div class="main" v-if="!needLogin" v-body-scroll-lock="lockScroll">
      <div class="head" ref="headRef">
        <div :class="dir.length==0 ? 'itemDir_end' : 'itemDir'" @click="toDir(-1)">Root</div>
        <div v-for="(item, index) in dir" :key="index" style="display: flex;">
          <div style="margin-right: 2px; user-select: none;">></div>
          <div :class="dir.length-1==index ? 'itemDir_end' : 'itemDir'" @click="toDir(index)">{{ item }}</div>
        </div>
      </div>
      <div class="tools">
        <div class="upload_button">上传</div>
        <div class="newFolder_button" @click="newFolderHandler">新建文件夹</div>
        <div :class="selectedList.length==1 ? 'rename_button' : 'rename_button_disabled'">重命名</div>
        <div :class="selectedList.length==0 ? 'del_button_disabled' : 'del_button'">删除</div>
      </div>
      <div class="tools" style="margin-top: 15px;margin-left: 10px;">
        <a-checkbox @change="selectAll" :checked="isAllSelected()" :indeterminate="isIndeterminate()">全选 (共{{ list.length }}个项目)</a-checkbox>
      </div>
      <div class="body">
        <div class="listTitle">
          <div></div>
          <div></div>
          <div>名称</div>
          <div>大小</div>
        </div>
        <div v-for="(item, index) in list" :key="index">
          <div class="fileItem" v-if="!item.name.startsWith('.')">
            <div class="tick"><a-checkbox @change="selectFile(index)" :checked="item.selected"></a-checkbox></div>
            <div class="icon" @click="openItem(item)">
              <img :src="getIconSrc(item)" width="30px">
            </div>
            <div class="fileName" @click="openItem(item)">{{ item.name }}</div>
            <div class="size" @click="openItem(item)">{{ formatBytes(item.size) }}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- 预览界面 -->
    <div :class="goCloseView ? 'fileViewer_after':'fileViewer'" v-if="showView">
      <div class="infoBar"> 
        <div class="viewer_fileName">{{ nowView.name }}</div>
        <div></div>
        <div class="viewer_download">
          <div class="viewer_downloadBt" @click="downloadHandler">下载</div>
        </div>
        <div class="viewer_close" @click="closeView">
          <i class="bi bi-x"></i>
        </div>
      </div>
      <div class="viewer_main">
        <div v-if="getFileType(nowView)=='video'" class="video_player">
          <video id="player"  playsinline controls :src="fileLinkGet()"></video>
        </div>
        <audio id="player" class="audio_player" controls :src="fileLinkGet()" v-else-if="getFileType(nowView)=='audio'"></audio>
        <img class="image_viewer" :src="fileLinkGet()" v-else-if="getFileType(nowView)=='image'">
        <iframe class="pdf_viewer" v-else-if="getFileType(nowView)=='pdf'" :src="fileLinkGet()" frameborder="0"></iframe>
        <img v-else :src="getIconSrc(nowView)" width="150px">
      </div>
    </div>
    <!-- 加载界面 -->
    <div class="loadingView" v-if="isLoading">
      <a-icon type="loading" style="margin-right: 5px;"/>
      Loading...
    </div>
    <!-- 登录界面 -->
    <div :class="goCloseLogin ? 'loginBg_after' : 'loginBg'" v-if="needLogin" ref="loginRef">
      <div class="loginPanel">
        <div class="title">登录</div>
        <div class="inputArea">
          <div class="inputText">用户</div>
          <a-input v-model="inputUserInfo.username"></a-input>
          <div class="inputText" style="margin-top: 20px;">密码</div>
          <a-input-password v-model="inputUserInfo.password"></a-input-password>
        </div>
        <div class="loginButton" @click="loginHandler">
          <i class="bi bi-arrow-right-short"></i>
        </div>
      </div>
    </div>
    <!-- 新建文件夹窗口 -->
    <a-modal
      v-model="showNewFolder"
      title="新建文件夹"
      centered
      cancelText="取消" 
      okText="确定"
      style="user-select: none;"
      @ok="newFolderOK">
      <a-input v-model="newFolderName" placeholder="新建文件夹名称"></a-input>
    </a-modal>
  </div>
</template>

<script>
const axios=require("axios");
import url from "./_tmp";
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
export default {
  data() {
    return {
      // 播放器
      player: undefined,
      // 当前文件/文件夹列表
      list: [],
      // 当前目录位置
      dir: [],
      // 选中的文件/文件夹
      selectedList: [],
      // 全选
      selectAll_prop: false,
      // 当前目录
      nowDir: '',
      // 当前预览的文件
      nowView: {},
      // 展示预览界面
      showView: false,
      // 动画中转变量(预览)
      goCloseView: false,
      // 显示加载中的界面
      isLoading: true,
      // 需要登录
      needLogin: true,
      // 输入的登录信息
      inputUserInfo: {
        username: '',
        password: ''
      },
      // 用户信息
      userInfo: {
        username: '',
        password: ''
      },
      // 动画中转变量(登录)
      goCloseLogin: false,
      // 新建文件夹Modal
      showNewFolder: false,
      // 新建文件夹名称
      newFolderName: "",
      // 锁定滚动
      lockScroll: false,
    }
  },
  methods: {
    // 确定新建文件夹
    newFolderOK(){
      axios.get(url.url+"/api/newFolder", {
        params: {
          dir: this.nowDir,
          name: this.newFolderName
        },
      }).then((response)=>{
        if(response.data.status==true){
          this.$message.success("创建文件夹成功!");
          this.showNewFolder=false;
          this.getList();
        }else{
          this.$message.error("创建文件夹失败!");
          this.showNewFolder=false;
        }
        this.newFolderName="";
      }).catch(()=>{
        this.$message.error("创建请求错误!");
        this.showNewFolder=false;
        this.newFolderName="";
      })
    },

    // 新建文件夹
    newFolderHandler() {
			this.showNewFolder=true;
    },

    // 下载文件
    downloadHandler(){
      document.location.href=url.url+"/api/downloadFile?dir="+this.nowDir+"/"+this.nowView.name;
    },
    
    // 关闭预览
    closeView(){
      this.goCloseView=true;
      var that=this;
      setTimeout(() => {
        that.showView=false;
        that.goCloseView=false;
      }, 200);
      
    },

    // 获取到文件地址
    fileLinkGet(){
      return url.url+"/api/getFile?dir="+this.nowDir+"/"+this.nowView.name;
    },

    // 跳转到某个目录
    toDir(dist){
      if(dist==-1){
        // 跳转到根目录
        this.nowDir="";
        this.dir=[];
        this.getList();
      }else{
        // 跳转到某个目录
        this.dir=this.dir.slice(0, dist+1);
        this.nowDir="";
        for (const item of this.dir) {
          this.nowDir+="/";
          this.nowDir+=item;
        }
        this.getList();
      }
    },

    // 打开某个文件/目录
    openItem(item){
      if(item.type=="dir"){
        // 如果是文件夹，进入文件夹
        this.nowDir+='/';
        this.nowDir+=item.name;
        this.dir=this.nowDir.split('/').filter(Boolean);
        this.getList();
        this.selectedList=[];
        this.selectAll_prop=false;
      }else{
        // 注意! 根据情况展示
        this.showView=true;
        this.nowView=item;
        if(this.getFileType(this.nowView)=='video' || this.getFileType(this.nowView)=='audio'){
          var that=this;
          this.$nextTick(() => {
            that.player = new Plyr('#player');
          });
        }
      }
    },

    // 是否处于半选状态
    isIndeterminate(){
      return this.selectedList.length!=this.list.length && this.selectedList.length!=0 ? true : false;
    },
    isAllSelected(){
      return this.selectedList.length==this.list.length && this.list.length!=0 ? true : false;
    },

    // 全选操作
    selectAll(e){
      if(e.target.checked){
        this.selectAll_prop=true;
        this.selectedList=[];
        for (const item of this.list) {
          item.selected=true;
          this.selectedList.push(item);
        }
      }else{
        this.selectAll_prop=false;
        for (const item of this.list) {
          item.selected=false;
          this.selectedList=[];
        }
      }
    }, 

    // 获取图标
    getIconSrc(file){
      var type=this.getFileType(file);
      switch(type){
        case 'image':
          return require('@/assets/fileIcons/image.svg');
        case 'folder':
          return require('@/assets/fileIcons/folder.svg');
        case 'document':
          return require('@/assets/fileIcons/word.svg');
        case 'pdf':
          return require('@/assets/fileIcons/pdf.svg');
        case 'audio':
          return require('@/assets/fileIcons/audio.svg');
        case 'zip':
          return require('@/assets/fileIcons/zip.svg');
        case 'ppt':
          return require('@/assets/fileIcons/ppt.svg');
        case 'txt':
          return require('@/assets/fileIcons/txt.svg');
        case 'video':
          return require('@/assets/fileIcons/video.svg');
        case 'html':
          return require('@/assets/fileIcons/html.svg');
        case 'xls':
          return require('@/assets/fileIcons/xls.svg');
        case 'bt':
          return require('@/assets/fileIcons/bt.svg');
        case 'unknown':
          return require('@/assets/fileIcons/unkown.svg');
      }
    },

    // 选择文件/文件夹
    selectFile(index){
      if(this.list[index].selected){
        this.list[index].selected=false;
        this.selectedList=this.selectedList.filter((item) => {
          return item.name != this.list[index].name
        });
      }else{
        this.list[index].selected=true;
        this.selectedList.push(this.list[index]);
      }
      // console.log(this.selectedList);
    },

    // 判断格式
    getFileType(file) {
      if(file==undefined){
        return '';
      }else if (file.type=='dir') {
        return 'folder';
      }
      const fileExtension = file.name.split('.').pop().toLowerCase();
      // 如果没有后缀名判断为文件夹
      switch (fileExtension) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'psd':
        case 'dng':
          return 'image';
        case 'xls':
        case 'xlsx':
          return 'xls'
        case 'txt':
        case 'c':
        case 'cpp':
        case 'swift':
        case 'java':
        case 'dart':
        case 'vue':
        case 'css':
        case 'js':
        case 'json':
        case 'md':
        case 'php':
        case 'py':
        case 'ruby':
        case 'cs':
        case 'sql':
        case 'go':
          return 'txt'
        case 'doc':
        case 'docx':
          return 'document';
        case 'html':
          return 'html';
        case 'ppt':
        case 'pptx':
          return 'ppt';
        case '7z':
        case 'rar':
        case 'zip':
        case 'tar':
        case 'gz':
          return 'zip';
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'flac':
          return 'audio';
        case 'mp4':
        case 'avi':
        case 'mkv':
        case 'mov':
        case 'rmvb':
          return 'video';
        case 'pdf':
          return 'pdf';
        case 'bt':
          return 'bt';
        default:
          return 'unknown';
      }
    },

    // 格式化文件大小显示
    formatBytes(bytes) {
      if(bytes==undefined){
        return "";
      }
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0){
        return '0 Byte';
      }
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)));
      return Math.round((bytes / Math.pow(1000, i)) * 100) / 100 + ' ' + sizes[i];
    },

    // 获取目录
    getList(){
      this.isLoading=true;
      axios.get(url.url+'/api/getlist', {
        params: {
          dir: this.nowDir
        },
      }).then((response)=>{
        this.list=response.data.list;
        this.isLoading=false;
        // console.log(this.list);
      }).catch(()=>{
        this.$message.error("加载错误");
      })
    },

    // 自动登录
    autoLogin(){
      if(localStorage.getItem("username")==this.userInfo.username && localStorage.getItem("password")==this.userInfo.password){
        return true;
      }else{
        return false;
      }
    },

    // 登录
    loginHandler(){
      if(this.inputUserInfo.username==this.userInfo.username && this.inputUserInfo.password==this.userInfo.password){
        this.$message.success("登录成功");
        this.goCloseLogin=true;
        localStorage.setItem("username", this.userInfo.username);
        localStorage.setItem("password", this.userInfo.password);
        setTimeout(() => {
          this.needLogin=false;
          this.goCloseLogin=false;
        }, 200);
      }else{
        this.$message.error("登录失败: 用户名或密码不正确");
      }
    },

    // 请求用户信息
    getUserInfo(){
      axios.get(url.url+"/api/authRequest")
      .then((response)=>{
        if(response.data.needLogin){
          this.userInfo.username=response.data.username;
          this.userInfo.password=response.data.password;
          if(this.autoLogin()){
            this.needLogin=false;
          }
        }else{
          this.needLogin=false;
        }
        this.isLoading=false;
      })
    },

    // 自动滚动目录到最右边
    autoScrollDir(){
      console.log("autoScroll");
      var that=this;
      this.$nextTick(() => {
        that.$refs.headRef.scrollTo({
          left: that.$refs.headRef.scrollWidth,
          behavior: 'smooth',
        });
      });
    }
  },

  created() {
    document.title="虚拟目录";
    this.getUserInfo();
  },

  mounted() {
    this.getList();
  },
  
  watch: {
    nowDir: function(){
      this.autoScrollDir();
    },
    needLogin: function(){
      this.autoScrollDir();
    },
    showView: function(newVal){
      this.lockScroll=newVal
    },
    isLoading: function(newVal){
      this.lockScroll=newVal
    }
  },
}
</script>

<style>
.loginButton:hover{
  background-color: rgb(0, 108, 210);
  cursor: pointer;
}
.loginButton{
  height: 50px;
  width: 50px;
  border-top-left-radius: 10px;
  position: absolute;
  right: 0;
  bottom: 0;
  background-color: rgb(24, 144, 255);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all linear .2s;
  color: white;
  font-size: 30px;
}
.inputText{
  text-align: left;
  width: 100%;
  font-size: 18px;
  margin-bottom: 5px;
}
.inputArea{
  height: 270px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.title{
  font-size: 25px;
  font-weight: bold;
}
.loginPanel{
  position: relative;
  padding: 20px;
  height: 400px;
  width: 300px;
  background-color: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.loginBg_after{
  opacity: 1;
  animation: opacityOut .2s forwards linear;
}
.loginBg{
  opacity: 0;
  animation: opacityIn .2s forwards linear;
}
.loginBg, .loginBg_after{
  user-select: none;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  background-image: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
  height: 100vh;
  width: 100vw;
}
.loadingView{
  animation: opacityIn .2s forwards linear;
  opacity: 0;
  animation-delay: 200ms;
  background-color: rgb(255, 255, 255);
  height: 100vh;
  width: 100vw;
  z-index: 100;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
}
.pdf_viewer{
	width: 100vw;
	height: calc(100vh - 50px);
}
.image_viewer{
  max-width: 60vw;
  max-height: 60vh;
} 
.video_player{
  max-width: 60vw;
}
@keyframes opacityOut {
  0%{
    opacity: 1;
  }
  100%{
    opacity: 0;
  }
}
@keyframes opacityIn{
  0%{
    opacity: 0;
  }
  100%{
    opacity: 1;
  }
}

.fileViewer{
  opacity: 0;
  animation: opacityIn .2s forwards linear;
}

.fileViewer_after{
  opacity: 1;
  animation: opacityOut .2s forwards linear;
}

.fileViewer, .fileViewer_after{
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.viewer_main{
  width: 100vw;
  height: calc(100vh - 50px);
  /* background-color: red; */
  display: flex;
  justify-content: center;
  align-items: center;
}
.viewer_close:hover{
  color: rgb(0, 108, 210);
  cursor: pointer;
}
.viewer_close{
  display: flex;
  align-items: center;
  font-size: 28px;
  justify-content: center;
  user-select: none;
  transition: all ease-in-out .3s;
}
.viewer_download{
  display: flex;
  align-items: center;
}
.viewer_downloadBt:hover{
  background-color: rgb(0, 108, 210);
  cursor: pointer;
}
.viewer_downloadBt{
  display: flex;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
  user-select: none;
  border-radius: 5px;
  background-color: rgb(24, 144, 255);
  color: white;
  align-items: center;
  justify-content: center;
  transition: all ease-in-out .2s;
}
.viewer_fileName{
  width: 100%;
  text-align: left;
  padding-left: 20px;
  font-weight: bolder;
  /* display: flex; */
  /* justify-content: center; */
  align-items: center;
  font-size: 18px;
  overflow: hidden;
  white-space:nowrap;
  text-overflow: ellipsis;
  line-height: 50px;
}
.infoBar{
  display: grid;
  width: 100vw;
  height: 50px;
  background-color: white;
  grid-template-columns: 300px auto 50px 50px;
}
.fileName{
  overflow: hidden;
  white-space:nowrap;
  text-overflow: ellipsis;
  line-height: 50px;
}
.size{
  text-align: right;
  line-height: 50px;
}
.listTitle{
  width: 100%;
  display: grid;
  grid-template-columns: 30px 40px auto 50px;
  height: 30px;
  text-align: left;
  user-select: none;
  align-items: center;
  font-weight: bolder;
  padding-right: 10px;
  padding-left: 10px;
}
.fileItem:hover{
  cursor: pointer;
  background-color: rgb(245, 245, 245);
}
.fileItem{
  width: 100%;
  display: grid;
  grid-template-columns: 30px 40px auto 100px;
  height: 50px;
  text-align: left;
  user-select: none;
  align-items: center;
  border-top: 1px solid rgb(245, 245, 245);
  transition: all ease-in-out .2s;
  font-weight: 400;
  padding-right: 10px;
  padding-left: 10px;
}
.rename_button_disabled, .del_button_disabled{
  cursor: not-allowed;
}
.rename_button_disabled, .del_button_disabled{
  color: grey;
}
.upload_button, .newFolder_button, .rename_button, .rename_button_disabled, .del_button_disabled{
  margin-right: 10px;
}
.upload_button, .newFolder_button, .rename_button, .del_button, .rename_button_disabled, .del_button_disabled{
  user-select: none;
  transition: all ease-in-out .2s;
}
.newFolder_button:hover, .rename_button:hover{
  color: rgb(24, 144, 255);
  cursor: pointer;
}
.del_button:hover{
  color: red;
  cursor: pointer;
}
.upload_button{
  background-color: rgb(24, 144, 255);
  color: white;
  padding: 5px 10px 5px 10px;
  border-radius: 6px;
}
.upload_button:hover{
  background-color: rgb(0, 108, 210);
  cursor: pointer;
}
.tools{
  margin-top: 5px;
  display: flex;
  align-items: center;
  user-select: none;
}
.itemDir_end{
  font-weight: bold;
}
.itemDir, .itemDir_end{
  margin-right: 2px;
  user-select: none;
  transition: all linear .2s;
  border-radius: 5px;
  padding: 0px 7px 0px 7px;
  white-space: nowrap;
}
.itemDir:hover{
  cursor: pointer;
  background-color: rgb(218, 237, 255);
  color: rgb(24, 144, 255);
}
.head{
  font-size: 18px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  overflow: auto;
  padding-bottom: 10px;
}
.main{
  width: 800px;
  /* height: 100px; */
  /* background-color: red; */
  /* background-color: lightblue; */
  padding-left: 10px;
  padding-right: 10px;
  animation: opacityIn .2s forwards linear;
  animation-delay: 200ms;
  opacity: 0;
}
@media screen and (max-width: 800px) {
  .main{
    width: 100%;
    /* background-color: blue; */
  }
}
#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
