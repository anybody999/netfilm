import axiosLoklok from "configs/axiosLoklok";
import { PATH_API } from "configs/path.api";
import { STATUS } from "constants/status";
import type { NextApiRequest, NextApiResponse } from "next";
import catchAsync from "utils/catch-async";
import { ApiError, responseError, responseSuccess } from "utils/response";

const StarInfoApi = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query } = req;
  const { starId = 18 } = query;
  if (method !== "GET") {
    const error = new ApiError(STATUS.METHOD_NOT_ALLOWED, "Method not allowed");
    return responseError(error, res);
  }
  const { data } = await axiosLoklok(PATH_API.star, { params: { starId } });
  const response = {
    message: "Get star info successfully!",
    data,
  };
  responseSuccess(res, response);
};

export default catchAsync(StarInfoApi);
