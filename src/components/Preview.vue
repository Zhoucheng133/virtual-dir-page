<template>
  <div class="titleBar">
    <div class="fileName">{{ stores().preview.item.fileName }}</div>
    <div class="downloadButton" @click="stores().fileDownload(stores().preview.item.fileName)">下载</div>
    <div class="closeButton" @click="closePreview"><i class="bi bi-x"></i></div>
  </div>
  <div class="previewMain">
    <vue-plyr v-if="stores().preview.item.type=='video'" :options="options">
      <video controls crossorigin playsinline :src="stores().preview.link"></video>
    </vue-plyr>
    <vue-plyr v-else-if="stores().preview.item.type=='audio'" :options="options">
      <audio controls crossorigin playsinline :src="stores().preview.link"></audio>
    </vue-plyr>
    <img v-else-if="stores().preview.item.type=='image'" :src="stores().preview.link" alt="" class="imagePreview">
    <iframe v-else-if="stores().preview.item.type=='pdf'" :src="stores().preview.link" frameborder="0" class="pdfPreview"></iframe>
    <img v-else :src="stores().getIconSrc(stores().preview.item)" style="width: 100px;">
  </div>
</template>

<script setup>
import stores from '../stores';
const emit=defineEmits(['fadeOut'])
document.body.style.overflow = 'hidden';
const closePreview=()=>{
  emit('fadeOut');
  setTimeout(() => {
    stores().setPreview('', {});
  }, 200);
}
window.addEventListener("keydown", (event)=>{
  if(event.key=='Escape'){
    closePreview();
  }
})
const options = {
  i18n: {
    speed: '速度',
    normal: '默认'
  }
}
</script>

<style>
.plyr--audio{
  display: flex !important;
  justify-content: center !important;
}
.plyr{
  max-height: 80vh;
  max-width: 80vw;
}
</style>

<style scoped>
.pdfPreview{
  height: calc(100vh - 50px);
  width: 100vw;
  margin-top: 30px;
}
.imagePreview{
  max-width: 80vw;
  max-height: 80vh;
}
.closeButton{
  margin-left: 10px;
  font-size: 25px;
  cursor: pointer;
}
.previewMain{
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 80px) ;
}
.downloadButton:hover{
  background-color: #0f5cc7;
}
.downloadButton{
  margin-left: auto;
  background-color: #1677ff;
  color: white;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 6px;
  padding-bottom: 6px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color linear .2s;
}
.fileName{
  font-size: 16px;
}
.titleBar{
  user-select: none;
  padding-left: 20px;
  padding-right: 20px;
  height: 50px;
  display: flex;
  align-items: center;
}
</style>