// src/lib/APISDK.ts

import store from "store";

export default class APISDK {
  static API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://truesource-backend-production.up.railway.app/api/v1";

  /**
   * Get auth token from store
   */
  static getAuthToken(): string | null {
    return store.get("token");
  }

  /**
   * Get API key from store
   */
  static getApiKey(): string | null {
    return store.get("apiKey");
  }

  /**
   * Generic GET request
   */
  static get(
    url: string,
    headers: any = {},
    resolveDirect = false
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      })
        .then((res) => res.json())
        .then((result) => {
          if (resolveDirect) {
            resolve(result);
          } else {
            if (result.success) {
              resolve(result.result || result.data);
            } else {
              reject(result.error || result.message);
            }
          }
        })
        .catch((err) => {
          console.error("GET Error:", err);
          reject(err);
        });
    });
  }

  /**
   * GET with auth token
   */
  static getWithAuth(
    url: string,
    headers: any = {},
    resolveDirect = false
  ): Promise<any> {
    const authToken = this.getAuthToken();
    return this.get(
      url,
      {
        Authorization: authToken ? `Bearer ${authToken}` : "",
        ...headers,
      },
      resolveDirect
    );
  }

  /**
   * GET with API key
   */
  static getWithApiKey(
    url: string,
    headers: any = {},
    resolveDirect = false
  ): Promise<any> {
    const apiKey = this.getApiKey();
    return this.get(
      url,
      {
        "api-key": apiKey || "",
        ...headers,
      },
      resolveDirect
    );
  }

  /**
   * Generic POST request
   */
  static post(
    url: string,
    payload: any,
    headers: any = {},
    resolveDirect = false
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          payload,
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (resolveDirect) {
            resolve(result);
          } else {
            if (result.success) {
              resolve(result.result || result.data);
            } else {
              reject(result.error || result.message);
            }
          }
        })
        .catch((err) => {
          console.error("POST Error:", err);
          reject(err);
        });
    });
  }

  /**
   * POST with auth token
   */
  static postWithAuth(
    url: string,
    payload: any,
    headers: any = {},
    resolveDirect = false
  ): Promise<any> {
    const authToken = this.getAuthToken();
    return this.post(
      url,
      payload,
      {
        Authorization: authToken ? `Bearer ${authToken}` : "",
        ...headers,
      },
      resolveDirect
    );
  }

  /**
   * POST with API key
   */
  static postWithApiKey(
    url: string,
    payload: any,
    headers: any = {},
    resolveDirect = false
  ): Promise<any> {
    const apiKey = this.getApiKey();
    return this.post(
      url,
      payload,
      {
        "api-key": apiKey || "",
        ...headers,
      },
      resolveDirect
    );
  }

  /**
   * Generic PUT request
   */
  static put(
    url: string,
    payload: any,
    headers: any = {},
    resolveDirect = false
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          payload,
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (resolveDirect) {
            resolve(result);
          } else {
            if (result.success) {
              resolve(result.result || result.data);
            } else {
              reject(result.error || result.message);
            }
          }
        })
        .catch((err) => {
          console.error("PUT Error:", err);
          reject(err);
        });
    });
  }

  /**
   * PUT with auth token
   */
  static putWithAuth(
    url: string,
    payload: any,
    headers: any = {},
    resolveDirect = false
  ): Promise<any> {
    const authToken = this.getAuthToken();
    return this.put(
      url,
      payload,
      {
        Authorization: authToken ? `Bearer ${authToken}` : "",
        ...headers,
      },
      resolveDirect
    );
  }

  /**
   * PUT with API key
   */
  static putWithApiKey(
    url: string,
    payload: any,
    headers: any = {},
    resolveDirect = false
  ): Promise<any> {
    const apiKey = this.getApiKey();
    return this.put(
      url,
      payload,
      {
        "api-key": apiKey || "",
        ...headers,
      },
      resolveDirect
    );
  }

  /**
   * Generic DELETE request
   */
  static Delete(
    url: string,
    payload: any = {},
    headers: any = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          payload,
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            resolve(result.result || result.data);
          } else {
            reject(result.error || result.message);
          }
        })
        .catch((err) => {
          console.error("DELETE Error:", err);
          reject(err);
        });
    });
  }

  /**
   * DELETE with auth token
   */
  static DeleteWithAuth(
    url: string,
    payload: any = {},
    headers: any = {}
  ): Promise<any> {
    const authToken = this.getAuthToken();
    return this.Delete(url, payload, {
      Authorization: authToken ? `Bearer ${authToken}` : "",
      ...headers,
    });
  }

  /**
   * File upload with auth
   */
  static fileUploadWithAuth(
    url: string,
    filesArray: File[],
    fileType = "file"
  ): Promise<any> {
    const formData = new FormData();
    const authToken = this.getAuthToken();
    const apiKey = this.getApiKey();

    for (let i = 0; i < filesArray.length; i += 1) {
      formData.append(fileType, filesArray[i], filesArray[i].name);
    }

    return new Promise((resolve, reject) => {
      fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : "",
          "api-key": apiKey || "",
        },
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            resolve(result.result || result.data);
          } else {
            reject(result.error || result.message);
          }
        })
        .catch((err) => {
          console.error("Upload Error:", err);
          reject(err);
        });
    });
  }

  /**
   * Multiple file upload
   */
  static multipleFileUpload(url: string, filesArray: File[]): Promise<any> {
    const formData = new FormData();
    const authToken = this.getAuthToken();
    const apiKey = this.getApiKey();

    for (let i = 0; i < filesArray.length; i += 1) {
      formData.append("fileList", filesArray[i]);
    }

    return new Promise((resolve, reject) => {
      fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : "",
          "api-key": apiKey || "",
        },
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            resolve(result.result || result.data);
          } else {
            reject(result.error || result.message);
          }
        })
        .catch((err) => {
          console.error("Multiple Upload Error:", err);
          reject(err);
        });
    });
  }
}
