import axios from "axios";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_TARGET}/api/v1`,
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

// * Пишем перехватчик для перевыпуска accessToken при его истечении.
// Несколько запросов могут словить 401 одновременно (например, при первой
// загрузке страницы) — чтобы не слать по refresh-запросу на каждый из них,
// делимся одним и тем же промисом обновления токена между всеми.
let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const prevReq = error.config;

    if (!error.response || error.response.status !== 401 || prevReq?.sent) {
      return Promise.reject(error);
    }
    prevReq.sent = true;

    if (!refreshPromise) {
      refreshPromise = axios
        .get(`${import.meta.env.VITE_TARGET}/api/v1/tokens/refresh`, {
          withCredentials: true,
        })
        .then((response) => {
          accessToken = response.data.accessToken;
          return accessToken;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const freshToken = await refreshPromise;
      prevReq.headers.Authorization = `Bearer ${freshToken}`;
      return axiosInstance(prevReq);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
