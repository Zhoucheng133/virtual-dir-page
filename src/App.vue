<template>
  <div id="app">
    <div class="main">
      <div class="head">
        <div :class="dir.length==0 ? 'itemDir_end' : 'itemDir'" style="margin-right: 2px;">Root</div>
        <div v-for="(item, index) in dir" :key="index" style="display: flex;">
          <div style="margin-right: 2px; user-select: none;">></div>
          <div style="margin-right: 2px;" :style="{ 'font-weight' : index==dir.length-1 ? 'bold' : 'light' }" :class="dir.length-1==index ? 'itemDir_end' : 'itemDir'">{{ item }}</div>
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
    }
  },
  methods: {
    
  },
  created() {
    document.title="虚拟目录";
    // const path = window.location.pathname;
    console.log(window.location.pathname);
    const path="/index/page/newpage/1";
    this.dir=path.split('/').filter(Boolean);
    console.log(this.dir);
  },
  mounted() {
    this.player = new Plyr('#player');
    this.list=JSON.parse(data.data);
    // console.log(this.list);
  },
}
</script>

<style>
.itemDir_end{
  user-select: none;
  padding: 0px 7px 0px 7px;
}
.itemDir{
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
  font-size: 20px;
  margin-top: 20px;
  display: flex;
  align-items: center;
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
