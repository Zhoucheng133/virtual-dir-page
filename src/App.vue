<template>
  <div id="app">
    <video id="player" playsinline controls src="http://192.168.101.105:8081/osuRecord/rePlay/osu26.mp4" width="1000px"></video>
  </div>
</template>

<script>
// const axios=require("axios");
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
export default {
  data() {
    return {
      player: undefined,
    }
  },
  methods: {
    
  },
  created() {
    
  },
  mounted() {
    this.player = new Plyr('#player');
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
