// import axios from "axios";

// const axiosInstance = axios.create({
//   baseURL: `${import.meta.env.VITE_TARGET}/api`,
//   headers: { "Content-Type": "application/json" },
// });

// let accessToken = "";

// export function setAccessToken(newToken) {
//   accessToken = newToken;
// }

// export default axiosInstance;

import axios from "axios";

// * поменяй все axios на axiosInstance
const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_TARGET}/api`,
  withCredentials: true,
});

let accessToken = "";

export function setAccessToken(newToken) {
  accessToken = newToken;
}

// * Пишем перехватчик для приклеивания accessToken  к каждому запросу
axiosInstance.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// * Пишем перехватчик для перевыпуска accessToken при его истечении
axiosInstance.interceptors.response.use(
  (res) => {
    return res;
  },
  async (error) => {
    const prevReq = error.config;
    if (error.response.status === 401) {
      const response = await axios.get(
        `${import.meta.env.VITE_TARGET}/api/tokens/refresh`,
        { withCredentials: true } // * мы можем получить куку на клиенте
      );
      accessToken = response.data.accessToken;
      prevReq.sent = true;
      prevReq.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(prevReq);
    }
  }
);

export default axiosInstance;
