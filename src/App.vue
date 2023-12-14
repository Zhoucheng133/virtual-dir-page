<template>
  <div id="app" @dragenter.prevent="handleDragEnter" @dragleave.prevent.stop="handleDragLeave" @contextmenu.prevent.stop="onContextmenu()" @click="hideMenu" :style="{ height: appHeight }">
    <div class="fixItem" v-if="!needLogin">
      <div class="head" ref="headRef">
        <div :class="dir.length==0 ? 'itemDir_end' : 'itemDir'" @click="toDir(-1)">Root</div>
        <div v-for="(item, index) in dir" :key="index" style="display: flex;">
          <div style="margin-right: 2px; user-select: none;">></div>
          <div :class="dir.length-1==index ? 'itemDir_end' : 'itemDir'" @click="toDir(index)">{{ item }}</div>
        </div>
      </div>
      <div class="tools">
        <a-dropdown>
          <a-button type="primary">上传</a-button>
          <a-menu slot="overlay">
            <a-menu-item>
              <el-upload
                :action="getUploadUrl()"
                :show-file-list="false"
                :on-progress="handleProgress"
                :headers="{ username: userInfo.username, password: userInfo.password }"
                :on-success="handleSuccess"
                :on-error="handleError"
                :before-upload="beforeHandler"
                multiple
              >
                <div>上传文件</div>
              </el-upload>
            </a-menu-item>
            <a-menu-item>
              <input
                type="file"
                id="fileInput"
                ref="fileInput"
                @change="handleDirChange"
                multiple
                directory
                webkitdirectory
                style="display: none;" />
              <div @click="uploadDir">上传文件夹</div>
            </a-menu-item>
          </a-menu>
        </a-dropdown>
        <!-- <div :class="canDownload() ? 'download_button' : 'download_button_disabled'" @click="downloadHandler()"><i class="bi bi-download" style="margin-right: 5px;"></i>下载</div> -->
        <a-button style="margin-left: 10px;margin-right: 10px;" @click="downloadHandler()" :disabled="!canDownload()">下载</a-button>
        <div class="newFolder_button" @click="newFolderHandler">新建文件夹</div>
        <div :class="selectedList.length==1 ? 'rename_button' : 'rename_button_disabled'" @click="reNameHandler">重命名</div>
        <div :class="selectedList.length==0 ? 'del_button_disabled' : 'del_button'" @click="delHandler">删除</div>
        <div class="viewStyle" @click="changeViewStyle">
          <i class="bi bi-list-columns-reverse" v-if="!showInGrid"></i>
          <i class="bi bi-grid-3x3" v-else></i>
        </div>
      </div>
      <div class="tools" style="padding-top: 15px;padding-left: 10px;">
        <a-checkbox @change="selectAll" :checked="isAllSelected()" :indeterminate="isIndeterminate()">全选 (共{{ list.length }}个项目{{ selectedItems() }})</a-checkbox>
      </div>
      <div class="listTitle" v-if="!showInGrid">
        <div></div>
        <div></div>
        <div>名称</div>
        <div>大小</div>
      </div>
    </div>
    <div class="main" ref="mainRef" v-if="!needLogin" v-body-scroll-lock="lockScroll">
      <div style="margin-top: 159px;" v-if="!showInGrid">
        <div v-for="(item, index) in list" :key="index">
          <div :class="rightClickIndex==index ? 'menuItem' : 'fileItem'" @contextmenu.prevent.stop="onContextmenu(index, item)">
            <div class="tick"><a-checkbox @change="selectFile(index)" :checked="item.selected"></a-checkbox></div>
            <div class="icon" @click="openItem(item)">
              <img :src="getIconSrc(item)" width="30px" draggable="false">
            </div>
            <div class="fileName" @click="openItem(item)">{{ item.name }}</div>
            <div class="size" @click="openItem(item)">{{ formatBytes(item.size) }}</div>
          </div>
        </div>
      </div>
      <div style="margin-top: 135px;" v-else class="gridView" :style="{'grid-template-columns': 'repeat('+getColumns+', 1fr)', 'gap': getGap+'px'}">
        <div v-for="(item, index) in list" :key="index">
          <div :class="rightClickIndex==index ? 'menuGridItem' : 'gridItem'" @contextmenu.prevent.stop="onContextmenu(index, item)" @click="openItem(item)">
            <div class="gridTick">
              <a-checkbox @change="selectFile(index)" :checked="item.selected"></a-checkbox>
            </div>
            <div class="gridIcon">
              <img :src="getIconSrc(item)" width="80px" draggable="false">
            </div>
            <div class="gridName">{{ item.name }}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- 预览界面 -->
    <div :class="goCloseView ? 'fileViewer_after':'fileViewer'" v-if="showView">
      <div class="infoBar"> 
        <div class="viewer_fileName">{{ nowView.name }}</div>
        <div class="viewer_download">
          <div class="viewer_downloadBt" @click="downloadHandler()">下载</div>
        </div>
        <div class="viewer_close" @click="closeView">
          <i class="bi bi-x"></i>
        </div>
      </div>
      <div class="viewer_main">
        <div v-if="getFileType(nowView)=='video'" class="video_player">
          <vue-plyr>
            <video crossorigin playsinline controls :src="fileLinkGet()"></video>
          </vue-plyr>
        </div>
        <div v-else-if="getFileType(nowView)=='audio'">
          <vue-plyr class="audio_player">
            <audio crossorigin controls :src="fileLinkGet()"></audio>
          </vue-plyr>
        </div>
        <img class="image_viewer" :src="fileLinkGet()" v-else-if="getFileType(nowView)=='image'" draggable="false">
        <iframe class="pdf_viewer" v-else-if="getFileType(nowView)=='pdf'" :src="fileLinkGet()" frameborder="0"></iframe>
        <img v-else :src="getIconSrc(nowView)" width="150px" draggable="false">
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
    <!-- 重命名文件/文件夹 -->
    <a-modal
      v-model="showReName"
      title="重命名"
      centered
      cancelText="取消" 
      okText="确定"
      style="user-select: none;"
      @ok="reNameOK" 
      @cancel="reNameCancel">
      <a-input v-model="reName" placeholder="新的文件/文件夹名"></a-input>
    </a-modal>
    <!-- 上传进度 -->
    <div class="uploadPanel" :style="{'height': uploadHeight+'px'}" v-if="!needLogin">
      <div class="uploadBar" @click="uploadPanelController">
        <i v-if="uploadOk!=fileUpload.length" class="bi bi-file-earmark-arrow-up statusIcon"></i>
        <i v-else class="bi bi-check-circle statusIcon"></i>
        <div class="uploadTitle">上传列表</div>
        <i v-if="showUpload" class="bi bi-caret-down-fill uploadArrow"></i>
        <i v-else class="bi bi-caret-up-fill uploadArrow"></i>
      </div>
      <div class="uploadList">
        <div class="listContent" v-for="(item, index) in uploadList" :key="index">
          <div class="progressBg" :style="{'width': item.percentage+'%'}" v-if="item.status=='uploading'"></div>
          <div class="listImg"><img :src="getIconSrc(item)" width="30px" draggable="false"></div>
          <div class="listInfo">
            <div class="listFileName">{{ item.name }}</div>
            <div class="listFileSize">{{ formatBytes(item.size * item.percentage / 100) }} / {{ formatBytes(item.size) }}</div>
          </div>
          <div class="statusIcon">
            <i v-if="item.status=='success'" class="bi bi-check-circle"></i>
            <i v-else-if="item.status=='uploading' || item.status=='ready'" class="bi bi-file-earmark-arrow-up"></i>
            <i v-else class="bi bi-x-circle" style="color: red;"></i>
          </div>
        </div>
      </div>
    </div>
    <!-- 拖拽上传页面 -->
    <div class="dragBg" v-show="isDragging">
      <el-upload
      class="dragView"
      drag
      :action="getUploadUrl()"
      :show-file-list="false"
      :on-progress="handleProgress"
      :headers="{ username: userInfo.username, password: userInfo.password }"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeHandler"
      multiple>
        <div class="dragIcon"><i class="bi bi-file-earmark-arrow-up"></i></div>
        <div class="dragText">将文件拖拽到这里上传</div>
      </el-upload>
    </div>
  </div>
</template>

<script>
const axios=require("axios");
import url from "./_tmp";
const CryptoJS = require("crypto-js");
export default {
  data() {
    return {
      // app高度
      appHeight: '100vh',
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
      // 重命名文件/文件夹Modal
      showReName: false,
      // 重命名文件/文件夹名称
      reName: "",
      // 预览链接
      fileLink: "",
      // 上传的文件信息
      fileUpload: [],
      // 上传成功的文件个数
      uploadOk: 0,
      // 展开上传页
      showUpload: false,
      // 上传页offset
      uploadHeight: 50,
      // 上传列表(用于查看百分比)
      uploadList: [],
      // 显示drag提示
      isDragging: false,
      // 右键菜单选中的item
      rightClickIndex: null,
      // 是否以网格布局显示
      showInGrid: true,
      // 页面宽度
      pageWidth: 800,
    }
  },
  computed: {
    // 格子间隙
    getGap(){
      return (this.pageWidth-(this.getColumns*120)-20)/(this.getColumns-1);
    },
    // 一行的格子数
    getColumns(){
      return Math.floor((this.pageWidth-20)/120);
    },
  },
  methods: {
    // 切换显示模式
    changeViewStyle(){
      this.showInGrid=!this.showInGrid;
    },

    // 处理上传的文件
    uploadFiles(formData) {
      var that=this;
      axios.post(this.getUploadUrl(formData.get("paths")), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          username: this.userInfo.username, 
          password: this.userInfo.password
        },
        onUploadProgress: function(progressEvent) {
          let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          that.addToUploadList({
            name: formData.get('files').name,
            percentage: percentCompleted,
            status: "uploading",
            size: formData.get('files').size
          })
          
        }
      }).then(response => {
        if(response.data.status){
          this.addToUploadList({
            name: formData.get('files').name,
            percentage: 100,
            status: "success",
            size: formData.get('files').size
          })
        }else{
          this.addToUploadList({
            name: formData.get('files').name,
            percentage: 100,
            status: "fail",
            size: formData.get('files').size
          })
        }
        this.handleSuccess(response.data);
      }).catch(error => {
        console.error(error);
      });
    },

    // 上传文件夹变化
    handleDirChange(event){
      for (let i = 0; i < event.target.files.length; i++) {
        if(event.target.files[i].name.startsWith(".")){
          continue;
        }
        var formData = new FormData();
        formData.append('files', event.target.files[i]);
        formData.append('paths', event.target.files[i].webkitRelativePath);
        this.beforeHandler(event.target.files[i]);
        this.uploadFiles(formData);
        // console.log(formData.get("paths"));
      }
    },

    // 上传文件夹
    uploadDir(){
      this.$refs.fileInput.click();
    },


    // 拖拽离开
    handleDragLeave(event){
      event.preventDefault();
      if (event.clientX == 0 && event.clientY == 0) {
        this.isDragging = false;
      }
    },

    // 取消鼠标点击
    hideMenu(){
      this.rightClickIndex=null;
    },

    // 是否启用下载
    disableDownload(item){
      if(item==undefined){
        return true;
      }
      return false;
    },

    // 右键菜单
    onContextmenu(index, item){
      this.rightClickIndex=index;
      // console.log("showMenu");
      this.$contextmenu({
        items: [
          {
            label: "打开",
            disabled: item == undefined ? true : false,
            onClick: () => {
              this.openItem(item);
              this.rightClickIndex=null;
            }
          },
          {
            label: "下载",
            icon: "bi-file-arrow-down",
            disabled: this.disableDownload(item),
            onClick: () => {
              this.downloadHandler(item);
              this.rightClickIndex=null;
            }
          },
          {
            label: "刷新",
            icon: "bi-arrow-clockwise",
            onClick: () => {
              this.reload();
              this.rightClickIndex=null;
            },
            divided: true
          },
          {
            label: "新建文件夹",
            icon: "bi-folder-plus",
            onClick: () => {
              this.newFolderHandler();
              this.rightClickIndex=null;
            }
          },
          {
            label: "重命名",
            icon: "bi-pencil-square",
            disabled: item == undefined ? true : false,
            onClick: () => {
              for(var val of this.list){
                val.selected=false;
              }
              this.selectedList=[];
              this.list[index].selected=true;
              this.selectedList.push(item);
              console.log(this.selectedList);
              this.reNameHandler();
              this.rightClickIndex=null;
            }
          },
          {
            label: "删除",
            icon: "bi-trash3",
            disabled: item == undefined ? true : false,
            onClick: () => {
              for(var val of this.list){
                val.selected=false;
              }
              this.selectedList=[];
              this.list[index].selected=true;
              this.selectedList.push(item);
              this.delHandler();
              this.rightClickIndex=null;
            }
          }
        ],
        event,
        customClass: "custom-class",
        zIndex: 3,
        minWidth: 150
      });
      return false;
    },

    // 是否可以下载
    canDownload(){
      if(this.selectedList.length==0){
        return false;
      }
      return true;
    },

    // 刷新列表
    reload(){
      this.getList();
      this.selectedList=[];
      for(var val of this.list){
        val.selected=false;
      }
      this.$message.success("已刷新")
    },

    // 拖拽
    handleDragEnter(){
      this.isDragging = true;
    },

    // 收起&展开上传列表
    uploadPanelController(){
      if(this.showUpload){
        this.uploadHeight=50;
      }else{
        this.uploadHeight=500;
      }
      this.showUpload=!this.showUpload
    },

    // 上传文件出现变化
    beforeHandler(file){
      this.fileUpload.push(file);
      this.uploadHeight=500;
      this.showUpload=!this.showUpload;
      this.isDragging=false;
    },

    // 上传失败
    handleError(){
      this.$message.error('一个或多个文件上传失败');
      this.fileUpload=[];
      this.uploadOk=0;
      this.getList();
    },

    // 上传成功
    handleSuccess(response){
      if (response.status) {
        this.uploadOk+=1
      } else {
        this.$message.error('上传失败');
        this.fileUpload=[];
        this.uploadOk=0;
      }
      if(this.uploadOk==this.fileUpload.length){
        this.$message.success('上传成功');
        this.fileUpload=[];
        this.uploadOk=0;
        this.getList();
      }
    },

    // 获取上传url
    getUploadUrl(path){
      if(path==undefined){
        return url.url+"/api/upload?dir="+encodeURIComponent(this.nowDir)+"&username="+localStorage.getItem("username")+"&password="+localStorage.getItem("password");;
      }else{
        return url.url+"/api/upload?dir="+encodeURIComponent(this.nowDir)+"/"+encodeURIComponent(path)+"&isDir=true"+"&username="+localStorage.getItem("username")+"&password="+localStorage.getItem("password");;
      }
    },

    // 判断是否需要添加到上传列表
    addToUploadList(newObj){
      const index = this.uploadList.findIndex(obj => obj.name === newObj.name && obj.size === newObj.size);

      if(newObj.status=="fail"){
        this.$message.error("上传失败!");
        return;
      }

      if (index !== -1) {
        // 如果存在，替换数组中的对象
        this.uploadList[index] = newObj;
      } else {
        // 如果不存在，将新对象添加到数组中
        this.uploadList.push(newObj);
      }
    },

    // 上传进度
    handleProgress(event, file, fileList){
      fileList.forEach((file) => {
        this.addToUploadList(file);
      });
    },

    // 确定删除
    delOK(){
      axios.get(url.url+"/api/del", {
        params: {
          dir: this.nowDir,
          files: this.selectedList,
        },
        headers: {
          username: localStorage.getItem("username"),
          password: localStorage.getItem("password")
        }
      }).then((response)=>{
        if(response.data.status==true){
          this.$message.success("删除成功!");
          this.selectedList=[];
        }else{
          this.$message.error("删除失败!");
          this.selectedList=[];
        }
      }).catch(()=>{
        this.$message.error("创建请求错误!");
        this.selectedList=[];
      }).finally(()=>{
        this.getList();
      })
    },

    // 删除
    delHandler(){
      if(this.selectedList.length==0){
        return;
      }
      var that=this;
      this.$confirm({
        title: '你确定要删除选中的文件/文件夹吗?',
        content: h => <div style="color:red;">这是不可逆的操作</div>,
        centered: true,
        okText: "确定",
        cancelText: "取消",
        onOk() {
          that.delOK();
        },
        onCancel() {
          that.selectedList=[];
          for(var item of that.list){
            item.selected=false;
          }
        },
      });
    },

    // 取消重命名
    reNameCancel(){
      this.showReName=false;
      this.selectedList=[];
      for(var item of this.list){
        item.selected=false;
      }
    },

    // 重命名
    reNameHandler(){
      if(this.selectedList.length!=1){
        return;
      }
      this.showReName=true;
      this.reName=this.selectedList[0].name;
    },

    // 确定重命名
    reNameOK(){
      axios.get(url.url+"/api/rename", {
        params: {
          dir: this.nowDir,
          oldName: this.selectedList[0].name,
          newName: this.reName,
        },
        headers: {
          username: localStorage.getItem("username"),
          password: localStorage.getItem("password")
        }
      }).then((response)=>{
        if(response.data.status==true){
          this.$message.success("重命名成功!");
          this.showReName=false;
          this.getList();
        }else{
          this.$message.error("重命名失败!");
          this.showReName=false;
        }
        this.reName="";
      }).catch(()=>{
        this.$message.error("创建请求错误!");
        this.showReName=false;
        this.reName="";
      }).finally(()=>{
        this.selectedList=[];
      })
    },

    // 确定新建文件夹
    newFolderOK(){
      axios.get(url.url+"/api/newFolder", {
        params: {
          dir: this.nowDir,
          name: this.newFolderName
        },
        headers: {
          username: localStorage.getItem("username"),
          password: localStorage.getItem("password")
        }
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
    downloadHandler(item){
      if(item!=undefined && item.type!="dir"){
        var downloadLink=url.url+"/api/downloadFile?dir="+encodeURIComponent(this.nowDir)+"/";
        downloadLink+=encodeURIComponent(item.name);
        downloadLink+="&username="+localStorage.getItem("username")+"&password="+localStorage.getItem("password");
        window.location.href=downloadLink;
        return;
      }else if(this.showView){
        var downloadLink=url.url+"/api/downloadFile?dir="+encodeURIComponent(this.nowDir)+"/";
        downloadLink+=encodeURIComponent(this.nowView.name)
        downloadLink+="&username="+localStorage.getItem("username")+"&password="+localStorage.getItem("password");
        window.location.href=downloadLink;
      }else if(this.selectedList.length==1 && this.selectedList[0].type!="dir"){
        var downloadLink=url.url+"/api/downloadFile?dir="+encodeURIComponent(this.nowDir)+"/";
        downloadLink+=encodeURIComponent(this.selectedList[0].name);
        downloadLink+="&username="+localStorage.getItem("username")+"&password="+localStorage.getItem("password");
        window.location.href=downloadLink;
      }else if(this.selectedList.length>1 && this.canDownload()){
        var downloadLink=url.url+"/api/multiDownload?dir="+encodeURIComponent(this.nowDir)+"/";
        const filesArray = this.selectedList.map(obj => encodeURIComponent(obj.name));
        const files=JSON.stringify(filesArray);
        downloadLink+="&files="+files;
        downloadLink+="&username="+localStorage.getItem("username")+"&password="+localStorage.getItem("password");
        window.location.href=downloadLink;
      }else if(item.type=="dir"){
        var downloadLink=url.url+"/api/multiDownload?dir="+encodeURIComponent(this.nowDir)+"/";
        const filesArray = [encodeURIComponent(item.name)];
        const files=JSON.stringify(filesArray);
        downloadLink+="&files="+files;
        downloadLink+="&username="+localStorage.getItem("username")+"&password="+localStorage.getItem("password");
        window.location.href=downloadLink;
      }
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
      return url.url+"/api/getFile?dir="+encodeURIComponent(this.nowDir)+"/"+encodeURIComponent(this.nowView.name)+"&username="+localStorage.getItem("username")+"&password="+localStorage.getItem("password");
    },

    // 跳转到某个目录
    toDir(dist){
      if(dist==-1){
        // 跳转到根目录
        this.nowDir="";
        this.dir=[];
      }else{
        // 跳转到某个目录
        this.dir=this.dir.slice(0, dist+1);
        this.nowDir="";
        for (const item of this.dir) {
          this.nowDir+="/";
          this.nowDir+=item;
        }
      }
      this.getList();
    },

    // 打开某个文件/目录
    openItem(item){
      if(item.type=="dir"){
        // 如果是文件夹，进入文件夹
        this.nowDir+='/';
        this.nowDir+=item.name;
        this.dir=this.nowDir.split('/').filter(Boolean);
        this.getList();
        this.selectAll_prop=false;
      }else{
        // 注意! 根据情况展示
        this.showView=true;
        this.nowView=item;
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
        case 'm4a':
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

    // 排序方法
    customSort(a, b) {
      let i = 0;

      while (i < a.length && i < b.length) {
        const charA = a.charAt(i);
        const charB = b.charAt(i);

        if (charA !== charB) {
          if (isNaN(charA) || isNaN(charB)) {
            // 如果不是数字，则按照默认字符串比较规则排序
            return charA.localeCompare(charB);
          } else {
            // 如果是数字，则按照数字大小从小到大排序
            const numA = parseInt(a.substring(i), 10) || 0;
            const numB = parseInt(b.substring(i), 10) || 0;

            return numA - numB;
          }
        }

        i++;
      }

      // 如果前面的字符都相同，则按照长度比较
      return a.length - b.length;
    },

    // 获取目录
    getList(){
      this.isLoading=true;
      axios.get(url.url+'/api/getlist', {
        params: {
          dir: this.nowDir
        },
        headers: {
          username: localStorage.getItem("username"),
          password: localStorage.getItem("password")
        }
      }).then((response)=>{
        this.list=response.data.list.sort((a, b)=>{
          // 按照type排序，type为dir的排在前面
          if (a.type === "dir" && b.type !== "dir") {
            return -1;
          } else if (a.type !== "dir" && b.type === "dir") {
            return 1;
          }
          
          return this.customSort(a.name, b.name)
        }).filter((item)=>{
          return !item.name.startsWith(".");
        });
        this.isLoading=false;
        // console.log(this.list);
      }).catch((error)=>{
        this.$message.error("加载错误: "+error);
      })
    },

    // 自动登录
    async autoLogin(){
      var flag=false;
      await axios.get(url.url+"/api/loginRequest",{
        params: {
          username: localStorage.getItem("username"),
          password: localStorage.getItem("password"),
        },
      }).then((response)=>{
        if(response.data.status){
          flag=true;
          this.userInfo.username=localStorage.getItem("username");
          this.userInfo.password=localStorage.getItem("password");
        }else{
          flag=false;
        }
      }).catch(()=>{
        flag=false;
      })
      return flag;
    },

    // 登录
    async loginHandler(){
      var flag=false;

      await axios.get(url.url+"/api/loginRequest",{
        params: {
          username: CryptoJS.SHA256(this.inputUserInfo.username).toString(),
          password: CryptoJS.SHA256(this.inputUserInfo.password).toString(),
        },
      }).then((response)=>{
        if(response.data.status){
          flag=true
        }else{
          this.$message.error("登录失败: 用户名或密码不正确");
        }
      }).catch(()=>{
        this.$message.error("登录失败: 登录请求错误");
      })

      if(flag==true){
        localStorage.setItem("username", CryptoJS.SHA256(this.inputUserInfo.username).toString());
        localStorage.setItem("password", CryptoJS.SHA256(this.inputUserInfo.password).toString());
        this.userInfo.username=CryptoJS.SHA256(this.inputUserInfo.username).toString();
        this.userInfo.password=CryptoJS.SHA256(this.inputUserInfo.password).toString();
        this.getList();
        setTimeout(() => {
          this.needLogin=false;
          this.goCloseLogin=false;
        }, 200);
      }
    },

    // 请求用户信息
    needLoginController(){
      axios.get(url.url+"/api/authRequest")
      .then(async (response)=>{
        if(response.data.needLogin){
          if(await this.autoLogin()){
            this.needLogin=false;
            this.getList();
          }
        }else{
          this.getList();
          this.needLogin=false;
        }
        this.isLoading=false;
      })
    },

    // 自动滚动目录到最右边
    autoScrollDir(){
      // console.log("autoScroll");
      var that=this;
      this.$nextTick(() => {
        that.$refs.headRef.scrollTo({
          left: that.$refs.headRef.scrollWidth,
          behavior: 'smooth',
        });
      });
    },

    // 显示已选中的文件/文件夹
    selectedItems(){
      if(this.selectedList.length==0){
        return "";
      }else{
        return ", 选中"+this.selectedList.length+"个";
      }
    },

    // 更新页面宽度
    updatePageWidth(){
      this.pageWidth=this.$refs.mainRef.clientWidth;
    }
  },

  updated(){
    if(!this.needLogin){
      this.updatePageWidth();
    }
  },

  created() {
    document.title="虚拟目录";
    this.needLoginController();
  },

  mounted() {
    window.addEventListener("keydown", (event)=>{
      if (event.key == "Escape" && this.showView==true){
        this.closeView();
      }
    });
    window.onresize=()=>{
      this.updatePageWidth();
    }
  },
  
  watch: {
    nowDir: function(){
      this.autoScrollDir();
      this.selectedList=[];
    },
    needLogin: function(){
      this.autoScrollDir();
      // if(newVal==false){
      //   var that=this;
      //   this.$nextTick(()=>{
      //     // that.$refs.uploadDirRef.$children[0].$refs.input.webkitdirectory = true;
      //     console.log(that.$refs.uploadDirRef);
      //   })
      // }
    },
    showView: function(newVal){
      this.lockScroll=newVal
      if(newVal==true){
        this.fileLinkGet();
      }else{
        this.fileLink="";
      }
    },
    isLoading: function(newVal){
      this.lockScroll=newVal
    }
  },
}
</script>

<style>
.gridTick{
  position: absolute;
  left: 10px;
}
.gridName{
  margin-top: 10px;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.gridItem:hover{
  cursor: pointer;
  background-color: rgb(245, 245, 245);
}
.menuGridItem{
  background-color: rgb(245, 245, 245);
}
.gridItem, .menuGridItem{
  padding: 10px 10px 10px 10px;
  width: 120px;
  position: relative;
  transition: background-color linear .2s;
  border-radius: 10px;
}
.gridView{
  display: grid;
  user-select: none;
}
.viewStyle:hover{
  cursor: pointer;
}
.viewStyle{
  font-size: 15px;
  margin-left: auto;
  margin-right: 10px;
}
.dragView{
  background-color: rgba(255, 255, 255, 0.8);
}
.dragBg{
  height: 100vh;
  width: 100vw;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 300;
}
.el-upload-dragger{
  border: none !important;
  background-color: rgba(0, 0, 0, 0) !important;
  width: 100vw !important;
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  align-items: center !important;
}
.dragText{
  margin-top: 10px;
  font-size: 16px;
  font-weight: bold;
}
.dragIcon{
  font-size: 50px;
}
.statusIcon{
  font-size: 17px;
}
.uploadList{
  height: 450px;
  overflow: auto;
}
.statusIcon{
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
}
.progressBg{
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgb(237, 246, 255);
  z-index: -10;
  left: 0;
  top: 0;
  border-bottom: 2px solid rgb(24, 144, 255);
  transition: all ease-in-out .2s;
}
.listFileSize{
  color: grey;
}
.listFileName{
  font-weight: bold;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: left;
}
.listInfo{
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
  width: 100%;
}
.listImg{
  display: flex;
  justify-content: center;
  align-items: center;
  /* background-color: lightcyan; */
}
.listContent{
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: 50px auto 50px;
  padding-left: 10px;
  padding-right: 10px;
  align-items: center;
  /* background-color: orange; */
  height: 70px;
}
.uploadArrow{
  margin-left: auto;
  font-size: 13px;
  margin-right: 10px;
}
.uploadTitle{
  font-size: 15px;
  font-weight: bold;
  margin-left: 10px;
}
.uploadBar:hover{
  cursor: pointer;
  background-color: rgb(245, 245, 245);
}
.uploadBar{
  padding-left: 20px;
  padding-right: 20px;
  height: 50px;
  width: 100%;
  display: flex;
  align-items: center;
  transition: all linear .2s;
}
.uploadPanel{
  width: 380px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: white;
  z-index: 10;
  position: fixed;
  bottom: 50px;
  right: 50px;
  border-radius: 10px;
  overflow: hidden;
  user-select: none;
  transition: all cubic-bezier(0.4, 0, 0.2, 1) .3s;
  opacity: 0;
  animation: opacityIn .2s linear forwards;
}
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
  animation: opacityIn .2s forwards linear;
  opacity: 0;
  animation-delay: 500ms;
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
  width: 60vw;
  height: 33.75vw;
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
  z-index: 50;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  user-select: none;
  background-color: rgba(255, 255, 255, 0.9);
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
  grid-template-columns: auto 50px 50px;
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
  /* background-color: white; */
}
.fileItem:hover{
  cursor: pointer;
  background-color: rgb(245, 245, 245);
}
.fileItem, .menuItem{
  width: 100%;
  display: grid;
  grid-template-columns: 30px 40px auto 100px;
  height: 50px;
  text-align: left;
  user-select: none;
  align-items: center;
  border-top: 1px solid rgb(245, 245, 245);
  transition: background-color ease-in-out .2s;
  font-weight: 400;
  padding-right: 10px;
  padding-left: 10px;
}
.menuItem{
  background-color: rgb(245, 245, 245);
}
.download_button_disabled{
  background-color: grey;
  cursor: not-allowed;
}
.download_button:hover{
  background-color: rgb(0, 108, 210);
  cursor: pointer;
}
.download_button{
  background-color: rgb(24, 144, 255);
}
.download_button, .download_button_disabled{
  color: white;
  padding: 5px 10px 5px 10px;
  border-radius: 6px;
  margin-right: 10px;
  transition: all linear .2s;
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
  padding-top: 5px;
  display: flex;
  align-items: center;
  user-select: none;
  /* background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px); */
  /* background-color: white; */
  width: 100%;
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
.fixItem{
  position: fixed;
  width: 100%;
  z-index: 50;
  width: 800px;
  padding-left: 10px;
  padding-right: 10px;
  /* backdrop-filter: blur(15px); */
  background-color: white;
}

.head{
  padding-top: 20px;
  font-size: 18px;
  /* margin-top: 20px; */
  display: flex;
  align-items: center;
  overflow: auto;
  padding-bottom: 10px;
  /* background-color: white; */
  width: 100%;
  /* background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px); */
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
  .fixItem{
    width: 100%;
  }
  .main{
    width: 100%;
    /* background-color: blue; */
    padding-bottom: 70px;
  }
  .video_player{
    width: 95vw;
    height: 53.4375vw;
  }
  .uploadPanel{
    width: calc(100vw - 40px);
    right: auto;
    bottom: 10px;
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
  width: 100%;
}
</style>
