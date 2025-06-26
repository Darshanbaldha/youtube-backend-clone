import { User } from "../models/user.model.js";
import apiErrors from "../utils/apiErrors.js";
import { Apiresponses } from "../utils/apiResponses.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

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
  console.log(email);
  // if given array fiels is empty or any of one is empty then return true and run if part.
  // array take data comes from user check all data and give all data's return true or false.
  // we give him all data from user as field name. now fiels are one by one trim and after trimed it compare to empty string. if both are similear then return true.
  if (
    [fullname, username, email, password].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new apiErrors(400, "All fields are required");
  }

  // if all data are not empty then check user is already exested in db or not.
  // $or is part of mongodb.
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new apiErrors(409, "email or username already taken.");
  }

  // now checking file's local path
  const avtarLocalPath = req.files?.avtar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path; // this give the problem because if file not present then it not give the path.

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avtarLocalPath) {
    throw new apiErrors(400, "Avtar file is required. .");
  }
  // uploading on the cloudinary web site by the localpath
  const avtar = await uploadOnCloudinary(avtarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avtar) {
    throw new apiErrors(400, "Avtar file is required. .");
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
    throw new apiErrors(500, "user not registered.");
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

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: true });

    return accessToken, refreshToken;
  } catch (error) {
    throw new apiErrors(500, "Tokens are not generated.");
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
  if (!username || !email) {
    throw new apiErrors(400, "Username or email require.");
  }

  // from body check if user exists or not in db.
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiErrors(404, "User does not exists.");
  }

  // if user exists then check the password is correct or not.
  const checkPassword = await user.isPasswordCorrect(password);
  if (!checkPassword) {
    throw new apiErrors(401, "Invalid password");
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

export { registerUser, loginUser, logoutUser };
