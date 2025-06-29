import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Apiresponses } from "../utils/apiResponses.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiError from "../utils/apiErrors.js";

const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //   message: "ok",
  // });
  // get user detail from frontend
  // check vaidation or field not empty
  // check if user already exists : username, email
  // check for images, check for avatar
  // upload them to cloudinary
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  // all fields takes from body which is given by the request/response of brower.
  const { fullname, username, email, password } = req.body;
  console.table({ fullname, username, email, password });
  // if given array fiels is empty or any of one is empty then return true and run if part.
  // array take data comes from user check all data and give all data's return true or false.
  // we give him all data from user as field name. now fiels are one by one trim and after trimed it compare to empty string. if both are similear then return true.
  if (
    [fullname, username, email, password].some((field) => {
      console.log(`user.controller.js 1.field:- ${field}`);
      return field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // if all data are not empty then check user is already exested in db or not.
  // $or is part of mongodb.
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "email or username already taken.");
  }
  console.log(`user.controller.js 2.Existed User:- ${existedUser}`);

  // now checking file's local path
  const avtarLocalPath = req.files?.avtar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path; // this give the problem because if file not present then it not give the path.
  console.log(`user.controller.js 3.Avtar Local Path:- ${avtarLocalPath}`);
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
    // console.log(`user.controller.js 4.Files:- ${req.files}`);
    // console.log(`user.controller.js 5.Array of cover image:- ${Array.isArray(req.files.coverImage)}`);
    // console.log(`user.controller.js 6.Length:- ${req.files.coverImage.length}`);
    // console.log(`user.controller.js 7.Cover Image Local Path:- ${coverImageLocalPath}`);
  }

  if (!avtarLocalPath) {
    throw new ApiError(400, "Avtar file is required. .");
  }
  // uploading on the cloudinary web site by the localpath
  const avtar = await uploadOnCloudinary(avtarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log(`user.controller.js 8.Avtar:- ${avtar}`);
  console.dir(avtar);
  console.log(`user.controller.js 9.Cover Image:- ${coverImage}`);
  console.dir(coverImage);

  if (!avtar) {
    throw new ApiError(400, "Avtar file is required. .");
  }
  // creating the user in the db fields
  const user = await User.create({
    // fullname: fullname
    fullname,
    avtar: avtar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  // after try of createing the user find the id of user through the User.model and select all fields except pasword and refreshtoken.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // if not find the then give the error.
  if (!createdUser) {
    throw new ApiError(500, "user not registered.");
  }

  return res
    .status(201)
    .json(new Apiresponses(200, createdUser, "user registered successfully"));
});

// generateAccessAndRefreshToken is a method
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    console.log(`user.controller.js 10.user :- ${user}`);
    console.log(`user.controller.js 11.Access Token :- ${accessToken}`);
    console.log(`user.controller.js 12.Refresh Token :- ${refreshToken}`);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: true });

    return accessToken, refreshToken;
  } catch (error) {
    throw new ApiError(500, "Tokens are not generated.");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // if find the user then check the password
  // generate access and refresh token
  // send cookie

  // data comes from login form.
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or email require.");
  }

  // from body check if user exists or not in db.
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exists.");
  }

  console.log(`user.controller.js 13.user :- ${user}`);

  // if user exists then check the password is correct or not.
  const checkPassword = await user.isPasswordCorrect(password);
  console.log(`user.controller.js 14.Check Password :- ${checkPassword}`);
  if (!checkPassword) {
    throw new ApiError(401, "Invalid password");
  }

  // now take the tokens from generateAccessAndRefreshToken through id of the logged in user in the db.
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // if want to not send the password and token to the user the remove it or else ignore below line.
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // for cookie
  // cookie is modified by frontend by default, by enabling this option(httpOnly and secure) it can only modified by the server.
  const option = {
    httpOnly: true,
    secure: true,
  };

  // return the response to user
  // we send cookie to user but in json we send cookie them because if user/browser store cookie in the localstorage or any else storage then it have access to where stire the cookie.
  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new Apiresponses(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Successfully Logged In"
      )
    );
});

// logout method
const logoutUser = asyncHandler(async (req, res) => {
  // find the id and update
  await User.findByIdAndUpdate(
    // give the id of user and id comes from auth middleware.
    req.user._id,
    {
      // update refreshtoken value and set it to undefined.
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessTokenS", option)
    .clearCookie("refreshTokenS", option)
    .json(new Apiresponses(200, {}, "Looged Out."));
});

// when Access Token is expire then this method calls. And it refresh the access token.
const refreshAccessToken = asyncHandler(async (req, res) => {
  // cookie is from the web and body is used in mobile.
  // if frontend hit the request for generate new ACCESS TOKEN or expire ACCESS TOKEN.
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
  console.log(
    `user.controller.js 15.Incoming Refresh Token :- ${incomingRefreshToken}`
  );
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized response.");
  }

  try {
    // it verify db's token and frontend's token. and if it match then it have access of REFRESH_TOKEN_SECRET.
    // also it have access of _id of the user in the database.
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    console.log(`user.controller.js 16.Decoded Token :- ${decodedToken}`);

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token Expire.");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    console.log(
      `user.controller.js 17.New Refresh Token :- ${newRefreshToken}`
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new Apiresponses(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

// change the password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // req.user?.id is come from auth.middleware in verifyJWT's ending line. And it verifyJWT is connected with changeCurrentPassword through user.route.js.
  const user = await User.findById(req.user?._id);

  // isPasswordCorrect is comes from user.model.js and return true or false if oldpassword and db's password match of not.
  const isCorrectPassword = await user.isPasswordCorrect(oldPassword);

  if (!isCorrectPassword) {
    throw new ApiError(400, "Invalid Old Password.");
  }
  console.log(
    `user.controller.js 18. Is Correct Password ${isCorrectPassword}`
  );

  // set newpassword as password and save it in db. If it save in db then it go on user.model.js and inseide it go on .pre method. And after it encrypt the password.
  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new Apiresponses(200, {}, "Password Updated Successfully."));
});

// if user is logged in then get user info.
// req.user comes from auth.middleware.js
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new Apiresponses(200, req.user, "Current User Fetch Successfully."));
});

// Change account detail(username, fullname, etc)
const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        // fullname: fullname
        // email: email,
        fullname,
        email,
      },
    },
    // new: true only give the value after it update.
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new Apiresponses(200, user, "Account Detail Updated Successffully."));
});

// change or update files(avtar)
const updateUserAvtar = asyncHandler(async (req, res) => {
  const avtarLocalPath = req.file?.path;
  console.log(`user.controller.js 19. Avtar Local Path ${avtarLocalPath}`);
  if (!avtarLocalPath) {
    throw new ApiError(400, "Avtar not found.");
  }

  const avtar = await uploadOnCloudinary(avtarLocalPath);
  console.log(`user.controller.js 20. Avtar ${avtar}`);
  if (!avtar.url) {
    throw new ApiError(400, "Url not Found of avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avtar: avtar.url },
    },
    { new: true }
  ).select("-password");

  return res
    .sttus(200)
    .json(new Apiresponses(200, { user }, "Avtar updated Successfully."));
});

// change or update files(Cover Image)
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  console.log(
    `user.controller.js 21. Cover Image local Path ${coverImageLocalPath}`
  );
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image not found.");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  console.log(`user.controller.js 22. Cover Image ${coverImage}`);
  if (!coverImage.url) {
    throw new ApiError(400, "Url not Found of avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { coverImage: coverImage.url },
    },
    { new: true }
  ).select("-password");

  return res
    .sttus(200)
    .json(new Apiresponses(200, { user }, "Cover Image updated Successfully."));
});

// aggeration pipeline
// get details of channel's subscriber. and how many channel i subcribed.
const getUserChannelProfile = asyncHandler(async (req, res) => {
  // params is taken through the url.And in this params username is present.
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      // how many users(chennel) subscribed my chennel.
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      // how many chennel(user) i subscried.
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      // make a new field in db.
      $addFields: {
        // count the number of subscriber of the chennel.
        subscribersCount: {
          $size: "$subscribers",
        },
        // count the number of channel i subscribed.
        chennelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        // check whether i follow a perticuler channel or not. used to show subscribe or subscribed button.
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        chennelsSubscribedToCount: 1,
        isSubscribed: 1,
        avtar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "chennel does not exists");
  }
  console.log(`user.controller.js 22.Chennel ${channel}`);
  console.log(`user.controller.js 23.Chennel length ${channel.length}`);
  console.log(`user.controller.js 23.Chennel 0th object ${channel[0]}`);

  return res
    .status(200)
    .json(
      new Apiresponses(200, channel[0], "User channel fetched successfully.")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateUserAvtar,
  updateUserCoverImage,
  getUserChannelProfile,
};
