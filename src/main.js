import Vue from 'vue'
import App from './App.vue'

import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import VBodyScrollLock from 'v-body-scroll-lock';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.use(ElementUI);
Vue.use(Antd);
Vue.use(VBodyScrollLock)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
