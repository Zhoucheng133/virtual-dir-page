<template>
  <div class="body" @dragenter.prevent="drag().handleDragEnter">
    <div class="mainPage" :style="{width: pageWidth+'px'}">
      <div class="fixedArea" :style="{width: pageWidth+'px'}">
        <div class="head" v-if="stores().enableRead">
          <div class="pathItem" v-for="(item, index) in stores().path" :key="index" :style="{marginLeft: index==0 ? '10px' : '0'}" @click="stores().toDir(item)">
            <i class="bi bi-arrow-right-short" v-if="index!=0"></i><div class="pathText" :style="{fontWeight: index==stores().path.length-1 ? 'bold' : 'normal', color: index==stores().path.length-1 ? '#1677ff' : 'grey'}">{{ item }}</div>
          </div>
        </div>
        <div class="head" v-else>
          <div class="pathItem" style="margin-left: 10px;">
            <div class="pathText" style="font-weight: bold; color: #1677ff;">简易模式</div>
          </div>
        </div>
        <div class="opHead">
          <a-upload v-model:file-list="upload().fileList" :action="upload().uploadURL()" :showUploadList="false" :multiple="true" :before-upload="beforeUpload">
            <a-dropdown-button type="primary">
              上传
              <template #overlay>
              <a-menu>
                <a-menu-item @click="uploadDirHandler">
                  上传文件夹
                </a-menu-item>
              </a-menu>
            </template>
            </a-dropdown-button>
          </a-upload>
          <a-button style="margin-left: 10px;" :disabled="stores().selectedCount==0" @click="stores().mainDownload()">下载</a-button>
          <div class="newFolderButton" @click="newFolderModal">新建文件夹</div>
          <div :class="stores().selectedCount!=0?'delButton':'delButton_disabled'" @click="stores().delHandler()">删除</div>
          <div class="viewStyle" @click="stores().toggleViewStyle">
            <div class="viewStyleItem" v-if="!stores().gridStyle">
              <i class="bi bi-grid-3x3"></i>
            </div>
            <div class="viewStyleItem" v-else>
              <i class="bi bi-list"></i>
            </div>
          </div>
        </div>
        <input
          type="file"
          id="fileInput"
          ref="fileInput"
          @change="upload().handleDirChange"
          multiple
          directory
          webkitdirectory
          style="display: none;" />
        <div class="selectText">
          已选择 {{ stores().selectedCount }} 个项目
        </div>
        <div class="tableHead">
          <div class="tableHeadItem" style="justify-content: center; display: flex;">
            <a-checkbox @change="stores().allSelectToggle" v-model:checked="stores().allSelect" style="margin-right: 7px;">全选</a-checkbox>
          </div>
          <div class="tableHeadItem" v-show="!stores().gridStyle">文件名称</div>
          <div class="tableHeadItem" v-show="!stores().gridStyle">大小</div>
        </div>
      </div>
      <div class="content" style="margin-top: 160px;">
        <div v-if="!stores().gridStyle">
          <div v-for="(item, index) in stores().data" :key="index">
            <a-dropdown :trigger="['contextmenu']">
              <div :class="stores().data[index].isSelected ? 'tableSelected' : 'tableGrid'">
                <div class="tableItem" style="justify-content: center; display: flex;">
                  <a-checkbox v-model:checked="stores().data[index].isSelected"></a-checkbox>
                </div>
                <div class="tableItem" @click="stores().openHandler(item)">
                  <img :src="stores().getIconSrc(item)" width="25px" draggable="false">
                </div>
                <div class="tableItem" @click="stores().openHandler(item)">
                  <div class="fileName">{{ item.fileName }}</div>
                </div>
                <div class="tableItem" @click="stores().openHandler(item)">{{ item.isFile ? item.size: '' }}</div>
              </div>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="stores().openHandler(item)">打开</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item @click="stores().menuDownload(item)"><i class="bi bi-download" style="margin-right: 10px;"></i>下载</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item @click="renameModal(item)"><i class="bi bi-pen" style="margin-right: 10px;"></i>重命名</a-menu-item>
                  <a-menu-item @click="stores().delHandler(item)"><i class="bi bi-trash3" style="margin-right: 10px;"></i>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
        <div v-if="stores().gridStyle" class="gridViewStyle" :style="{'grid-template-columns':'repeat('+Math.floor((pageWidth)/120)+', 1fr)', 'grid-column-gap': (pageWidth-120*Math.floor((pageWidth)/120))/Math.floor((pageWidth)/120)+'px'}">
          <div :class="stores().data[index].isSelected ? 'gridItem_selected' : 'gridItem'" v-for="(item, index) in stores().data" :key="index" @click="stores().openHandler(item)">
            <a-dropdown :trigger="['contextmenu']">
              <div>
                <div class="gridImg">
                  <img :src="stores().getIconSrc(item)" height="50px" draggable="false" v-if="item.type!='image'">
                  <img v-lazy="stores().imgPreview(item.fileName)" style="max-width: 50px; max-height: 50px;" v-else>
                  <!-- <img :src="stores().getIconSrc(item)" height="50px" draggable="false"> -->
                </div>
                <div class="gridText">{{ item.fileName }}</div>
              </div>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="stores().openHandler(item)">打开</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item @click="stores().menuDownload(item)"><i class="bi bi-download" style="margin-right: 10px;"></i>下载</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item @click="renameModal(item)"><i class="bi bi-pen" style="margin-right: 10px;"></i>重命名</a-menu-item>
                  <a-menu-item @click="stores().delHandler(item)"><i class="bi bi-trash3" style="margin-right: 10px;"></i>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-checkbox class="gridCheckbox" @click.stop="(event)=>event.stopPropagation()"  v-model:checked="stores().data[index].isSelected"></a-checkbox>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div :class="previewIn ? 'preview':'previewOut'" v-if="stores().preview.item.fileName">
    <Preview @fadeOut="fadeOutPreview" />
  </div>
  <a-modal v-model:open="showRenameModel" title="重命名" centered okText="完成" cancelText="取消" @ok="okRename">
    <a-input v-model:value="inputFileName" :placeholder="formerName"></a-input>
  </a-modal>
  <a-modal v-model:open="showNewFolderModal" title="新建文件夹" centered okText="完成" cancelText="取消" @ok="okNewFolder">
    <a-input placeholder="新建文件夹" v-model:value="inputNewFolder"></a-input>
  </a-modal>
  <UploadPanel class="panel" />
  <DragView class="dragview" v-show="drag().onDrag" @dragleave.prevent.stop="drag().handleDragLeave"/>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import stores from '../stores';
import Preview from './Preview.vue';
import upload from '../stores/upload';
import UploadPanel from './UploadPanel.vue';
import DragView from './DragView.vue';
import drag from "../stores/drag";
import { message } from 'ant-design-vue';
const pageWidth=ref(1000);
let previewIn=ref(true);
let showRenameModel=ref(false);
let inputFileName=ref("");
let formerName=ref("")
let showNewFolderModal=ref(false);
let inputNewFolder=ref("");
document.title="虚拟目录";
const beforeUpload=()=>{
  if(!stores().enableWrite){
    message.error("权限不允许")
    return false;
  }
  return true;
}
const uploadDirHandler=()=>{
  if(!stores().enableWrite){
    message.error("权限不允许")
    return;
  }
  const fileInput=document.getElementById('fileInput');
  fileInput.click();
}
const okNewFolder=()=>{
  stores().newFolderHandler(inputNewFolder.value);
  showNewFolderModal.value=false;
}
const renameModal=(item)=>{
  
  formerName.value=item.fileName;
  showRenameModel.value=true;
}
const newFolderModal=()=>{
  if(!stores().enableWrite){
    message.error("权限不允许")
    return;
  }
  showNewFolderModal.value=true;
}
const okRename=()=>{
  stores().renameHandler(formerName.value, inputFileName.value)
  showRenameModel.value=false;
}
const fadeOutPreview=()=>{
  previewIn.value=false;
  setTimeout(() => {
    previewIn.value=true;
  }, 300);
  document.body.style.overflowY = 'auto';
}
const calWidth=()=>{
  if(window.innerWidth>1040){
    pageWidth.value=1000;
  }else if(window.innerWidth>380){
    pageWidth.value=window.innerWidth-60
  }else{
    pageWidth.value=320
  }
}
window.onresize=()=>{
  calWidth();
}
onMounted(()=>{
  stores().getData();
  calWidth();
})
</script>

<style>
body{
  margin: 0;
}
</style>

<style scoped>
.gridCheckbox{
  position: absolute;
  top: 5px;
  left: 15px;
}
.gridItem:hover{
  background-color: rgb(240, 240, 240);
}
.gridItem_selected{
  background-color: rgb(245, 245, 245);
}
.gridItem, .gridItem_selected{
  cursor: pointer;
  transition: background-color linear .2s;
  border-radius: 10px;
  padding: 10px;
  width: 120px;
  position: relative;
}
.gridImg{
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  height: 50px;
  width: 100px;
}
.gridText{
  width: 100%;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  line-height: 16px;
}
.gridViewStyle{
  display: grid;
  grid-row-gap: 10px;
}
.viewStyleText{
  margin-left: 5px;
}
.viewStyleItem:hover{
  color: #1677ff;
}
.viewStyleItem{
  display: flex;
  cursor: pointer;
  transition: color linear .2s;
}
.viewStyle{
  margin-left: auto;
}
.dragview{
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
}
.panel{
  position: fixed;
  bottom: 50px;
  right: 50px;
}
@keyframes fadeIn {
  0%{
    opacity: 0;
  }
  100%{
    opacity: 1;
  }
}
@keyframes fadeOut {
  0%{
    opacity: 1;
  }
  100%{
    opacity: 0;
  }
}
.previewOut{
  animation: fadeOut .2s linear forwards;
}
.preview{
  animation: fadeIn .2s linear forwards;
}
.preview, .previewOut{
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 50;
}
.delButton_disabled{
  color: grey;
  margin-left: 15px;
  cursor: pointer;
  transition: color linear .2s;
}
.delButton:hover{
  color: darkred;
}
.delButton{
  color: red;
  margin-left: 15px;
  cursor: pointer;
  transition: color linear .2s;
}
.newFolderButton:hover{
  color: #0f5cc7;
}
.newFolderButton{
  color: #1677ff;
  margin-left: 15px;
  cursor: pointer;
  transition: color linear .2s;
}
.opHead{
  display: flex;
  align-items: center;
}
.fileName{
  width: 100%;
  height: 100%;
  line-height: 40px;
  top: 50%;
  /* transform: translateY(50%); */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tableItem{
  font-size: 14px;
  height: 100%;
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
}
.selectText{
  height: 30px;
  display: flex;
  align-items: center;
}
.fixedArea{
  position: fixed;
  top: 0;
  background-color: white;
  z-index: 10;
}
.tableSelected{
  background-color: rgb(245, 245, 245);
}
.tableGrid:hover, .tableSelected:hover{
  background-color: rgb(240, 240, 240);
}
.opHead{
  /* position: fixed; */
  /* top: 50px; */
  /* border: 1px solid pink; */
  height: 40px;
  background-color: white;
  z-index: 10;
}
.tableGrid, .tableSelected{
  display: grid;
  grid-template-columns: 50px 50px auto 100px;
  height: 40px;
  align-items: center;
  border-radius: 10px;
  transition: background-color linear .2s;
  cursor: pointer;
  /* border: 1px solid green; */
}
.tableHead{
  display: grid;
  grid-template-columns: 100px auto 100px;
  /* max-width: 1000px; */
  /* position: fixed; */
  height: 30px;
  align-items: center;
  /* border: 1px solid blue; */
  background-color: white;
  /* top: 90px; */
  /* z-index: 10; */
  border-bottom: 1px solid lightgrey;
}
.pathText:hover{
  color: #1677ff !important;
}
.pathText{
  transition: all linear .2s;
  cursor: pointer;
  transition: color linear .2s;
}
.pathItem{
  white-space: nowrap;
  display: flex;
  align-items: center;
}
.pageTitle{
  display: flex;
  align-items: center;
}
.head{
  /* position: fixed; */
  height: 50px;
  /* background-color: red; */
  /* border: 1px solid; */
  /* max-width: 1000px; */
  display: flex;
  align-items: center;
  overflow: auto;
  /* border: 1px solid red; */
  background-color: white;
  /* top: 0; */
  z-index: 10;
}
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar:hover{
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-track {
  background-color: white;
  border-radius: 2.5px;
}
::-webkit-scrollbar-thumb {
  background-color: rgb(240, 240, 240);
  border-radius: 2.5px;
}
::-webkit-scrollbar-thumb:hover{
  background-color: grey;
}
.body{
  width: 100vw;
  display: flex;
  min-height: 100vh;
  justify-content: center;
}
.mainPage{
  /* padding: 10px; */
  /* padding-left: 10px; */
  /* padding-right: 10px; */
  /* max-width: 1000px; */
  /* margin: auto; */
  user-select: none;
  padding-bottom: 100px;
  /* height: 200px; */
  /* background-color: red; */
}
</style>