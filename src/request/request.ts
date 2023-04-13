/*
 * @Author:
 * @Date: 2023-04-10 10:00:58
 * @LastEditTime: 2023-04-13 14:10:55
 * @Description:
 */
import axios from "axios";

// 配置项接口
interface AxiosOption {
  baseURL: string;
  timeout: number;
}

const backendOption: AxiosOption = {
  baseURL: "http://localhost:5001",
  timeout: 5000,
};

const rasaOption: AxiosOption = {
  baseURL: "http://localhost:5005",
  timeout: 5000,
};

// 创建两个单例
const backendInstance = axios.create(backendOption);
const rasaInstance = axios.create(rasaOption);

// 添加请求拦截器
const requestInterceptor = (config: any) => config;
const requestErrorInterceptor = (error: any) => Promise.reject(error);

backendInstance.interceptors.request.use(
  requestInterceptor,
  requestErrorInterceptor
);

rasaInstance.interceptors.request.use(
  requestInterceptor,
  requestErrorInterceptor
);

// 添加响应拦截器
const responseInterceptor = (response: any) => {
  return response;
};

const responseErrorInterceptor = (error: any) => Promise.reject(error);

backendInstance.interceptors.response.use(
  responseInterceptor,
  responseErrorInterceptor
);

rasaInstance.interceptors.response.use(
  responseInterceptor,
  responseErrorInterceptor
);

export { backendInstance, rasaInstance };
