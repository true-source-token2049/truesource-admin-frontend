"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  CheckCircle,
  Fingerprint,
} from "lucide-react";
import TrueSourceAPI from "@/lib/trueSourceApi";

const loginSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

interface LoginFormValues {
  email: string;
  password: string;
}

export default function Loginform() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const initialValues: LoginFormValues = {
    email: "",
    password: "",
  };

  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      setError("");

      // Replace with your actual API call
      const response: any = await TrueSourceAPI.login(values);

      if (!response.success) {
        throw new Error("Invalid credentials");
      }

      const data = response.result;
      localStorage.setItem("token", data.token?.access);

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              {/* TrueSource Logo */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-3 shadow-2xl">
                  <div className="flex items-center gap-1">
                    <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
                    <CheckCircle
                      className="w-5 h-5 text-white -ml-2"
                      strokeWidth={3}
                    />
                  </div>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  TrueSource
                </h1>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Portal</h2>
            <p className="text-gray-600 mt-2">Verify. Track. Authenticate.</p>
          </div>

          {/* Login Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-6">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@example.com"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.email && touched.email
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="mt-1 text-sm text-red-500"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.password && touched.password
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="mt-1 text-sm text-red-500"
                  />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Remember me
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </Form>
            )}
          </Formik>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-8">
            Don't have an account?{" "}
            <a
              href="#"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact Administrator
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-white text-center max-w-md">
          <div className="mb-8">
            {/* Large Logo */}
            <div className="w-28 h-28 mx-auto bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative">
              <div className="absolute inset-0 bg-white/10 rounded-3xl animate-pulse"></div>
              <div className="relative flex items-center gap-1">
                <Shield className="w-14 h-14 text-white" strokeWidth={2} />
                <CheckCircle
                  className="w-9 h-9 text-white -ml-4"
                  strokeWidth={2.5}
                />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-2">TrueSource</h2>
            <p className="text-sm font-semibold text-white/90 tracking-wider mb-4">
              PRODUCT IDENTITY SYSTEM
            </p>
            <p className="text-lg text-white/90">
              Authenticate products, trace origins, and build trust in your
              supply chain
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Fingerprint className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm text-white/80 mt-1">
                Verified Products
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Shield className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm text-white/80 mt-1">Secure Tracking</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm text-white/80 mt-1">100% Authentic</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
