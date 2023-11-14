<template>
  <div id="app">
    <div class="main">
      <div class="head" ref="headRef">
        <div :class="dir.length==0 ? 'itemDir_end' : 'itemDir'">Root</div>
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
      <div class="body">
        <div class="fileItem listTitle">
          <div></div>
          <div></div>
          <div>名称</div>
          <div>大小</div>
        </div>
        <div class="fileItem" v-for="(item, index) in list" :key="index">
          <div class="tick"></div>
          <div class="icon"></div>
          <div class="fileName">{{ item.name }}</div>
          <div class="size">{{ item.size }}</div>
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
    }
  },
  methods: {
    
  },
  created() {
    document.title="虚拟目录";
    const path="/index/page/newpage/test1/test2";
    this.dir=path.split('/').filter(Boolean);
  },
  mounted() {
    this.player = new Plyr('#player');
    this.list=JSON.parse(data.data).filter(item => !item.name.startsWith('.'));
    // 自动滚动到最右边
    this.$refs.headRef.scrollTo({
      left: this.$refs.headRef.scrollWidth,
      behavior: 'smooth',
    });
  },
}
</script>

<style>
.listTitle{
  font-weight: bolder;
  border-top: none !important;
}
.fileItem{
  width: 100%;
  display: grid;
  grid-template-columns: 30px 50px auto 50px;
  height: 50px;
  text-align: left;
  user-select: none;
  align-items: center;
  border-top: 1px solid rgb(230, 230, 230);
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
