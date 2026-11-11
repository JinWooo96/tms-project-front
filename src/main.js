import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import App from './App.vue';
import router from './router';
import './style.css';

// Pinia, Vue Router, Element Plus 등록

const app = createApp(App); // root로 하는 Vue 앱을 하나 만든다.

// 필요한 기능들 장착
// 모든 컴포넌트에서 따로 import를 할 필요가 없게 된다.
app.use(createPinia());
app.use(router);
app.use(ElementPlus);

// 완성된 앱을 HTML 파일 (index.html)의 <div id="app"> 자리에 그러넣는다.
app.mount('#app');

