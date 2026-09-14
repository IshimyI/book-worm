import axios from "axios";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_TARGET}/api/v1`,
  withCredentials: true,
});

let accessToken = "";

export function setAccessToken(newToken) {
  accessToken = newToken;
}

axiosInstance.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

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
