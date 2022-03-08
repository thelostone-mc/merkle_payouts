import { AxiosRequestConfig, AxiosResponse, Method } from "axios";

type APIResponseOK = {
  body: any;
};

type APIResponseError = {
  status: number;
  error: string;
};

type APIResponse = APIResponseError | APIResponseOK;

interface HTTPClient {
  request(config?: AxiosRequestConfig): Promise<AxiosResponse>;
}

export default class APIClient {
  public readonly httpClient;
  public readonly baseURL;
  public readonly token;

  public paths = {
    ingestMerkleClaims: "/grants/v1/api/ingest_merkle_claim_to_clr_match",
  };

  constructor(httpClient: HTTPClient, baseURL: string, token: string) {
    this.httpClient = httpClient;
    this.baseURL = baseURL;
    this.token = token;
  }

  public async ingestMerkleClaims(claims: Object) {
    return this.post(this.paths.ingestMerkleClaims, claims);
  }

  private async post(
    path: string,
    data?: Object,
    configOverride?: any
  ): Promise<APIResponse> {
    return this.request("post", path, data, configOverride);
  }

  private buildURL(path: string) {
    return new URL(path, this.baseURL);
  }

  private async request(
    method: Method,
    path: string,
    data?: Object,
    configOverride?: any
  ): Promise<APIResponse> {
    const config = {
      url: this.buildURL(path).toString(),
      method,
      data,
      headers: {
        token: this.token,
        ...configOverride,
      },
    };

    try {
      const resp = await this.httpClient.request(config);
      if (resp.status >= 200 && resp.status <= 299) {
        return {
          body: resp.data,
        };
      } else {
        return {
          status: resp.status,
          error: resp.data,
        };
      }
    } catch (err: any) {
      return {
        status: -1,
        error: err,
      };
    }
  }
}
