<template>
  <div id="app">
    <div class="main">
      <div class="head" ref="headRef">
        <div :class="dir.length==0 ? 'itemDir_end' : 'itemDir'" @click="toDir(0)">Root</div>
        <div v-for="(item, index) in dir" :key="index" style="display: flex;">
          <div style="margin-right: 2px; user-select: none;">></div>
          <div :class="dir.length-1==index ? 'itemDir_end' : 'itemDir'">{{ item }}</div>
        </div>
      </div>
      <div class="tools">
        <div class="upload_button">上传</div>
        <div class="newFolder_button">新建文件夹</div>
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
        <div class="fileItem" v-for="(item, index) in list" :key="index" @click="openItem(item)">
          <div class="tick"><a-checkbox @change="selectFile(index)" :checked="item.selected"></a-checkbox></div>
          <div class="icon">
            <img :src="getIconSrc(item)" width="30px">
          </div>
          <div class="fileName">{{ item.name }}</div>
          <div class="size">{{ formatBytes(item.size) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const axios=require("axios");
import data from "./_tmp";
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
    }
  },
  methods: {
    toDir(dist){
      if(dist==0){
        this.nowDir="";
        this.dir=[];
        this.getList();
      }
    },
    openItem(item){
      if(item.type=="dir"){
        this.nowDir+='/';
        this.nowDir+=item.name;
        this.dir=this.nowDir.split('/').filter(Boolean);
        this.getList();
      }else{
        // TODO 预览/下载文件
      }
    },
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
      if (file.type=='dir') {
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
      axios.get('/api/getlist', {
        params: {
          dir: this.nowDir
        },
      }).then((response)=>{
        this.list=response.data.list;
        // console.log(this.list);
      }).catch(()=>{
        this.$message.error("加载错误");
      })
    }
  },
  created() {
    document.title="虚拟目录";
    this.dir=this.nowDir.split('/').filter(Boolean);
  },
  mounted() {
    this.player = new Plyr('#player');
    // this.list=JSON.parse(data.data).filter(item => !item.name.startsWith('.'));

    this.getList();

    // 自动滚动到最右边
    this.$refs.headRef.scrollTo({
      left: this.$refs.headRef.scrollWidth,
      behavior: 'smooth',
    });
  },
}
</script>

<style>
.fileName{
  overflow: hidden;
  white-space:nowrap;
  text-overflow: ellipsis;
}
.size{
  text-align: right;
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
.itemDir{
  font-weight: lighter;
}
.itemDir, .itemDir_end{
  margin-right: 2px;
  user-select: none;
  transition: all linear .2s;
  border-radius: 5px;
  padding: 0px 7px 0px 7px;
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
