"use client";

import React, { useState } from "react";
import {
  Lock,
  Save,
  Unlock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updatePasswordProtection, removePasswordProtection } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { RevButtons } from "@/components/ui/RevButtons";
import { Input } from "@/components/ui/input";

interface PasswordProtectionProps {
  userId: string;
  hasPassword: boolean;
}

export function PasswordProtectionUI({
  userId,
  hasPassword,
}: PasswordProtectionProps) {
  const { toast } = useToast();
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(hasPassword);
  const [showPasswordFields, setShowPasswordFields] = useState(!hasPassword);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | null
  >(null);

  const toggleProtection = () => {
    setIsProtectionEnabled(!isProtectionEnabled);
  };

  const showChangePasswordUI = () => {
    setShowPasswordFields(true);
    setPassword("");
    setConfirmPassword("");
    setPasswordStrength(null);
  };

  const checkPasswordStrength = (value: string) => {
    if (!value) {
      setPasswordStrength(null);
      return;
    }

    const hasLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const strength = [
      hasLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;

    if (strength <= 2) setPasswordStrength("weak");
    else if (strength <= 4) setPasswordStrength("medium");
    else setPasswordStrength("strong");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    checkPasswordStrength(value);
  };

  const handleRemovePassword = async () => {
    setIsUpdating(true);
    try {
      const result = await removePasswordProtection(userId);
      toast({
        title: "Password Removed",
        description: "Your portfolio is no longer password protected.",
        variant: "default",
      });
      setShowPasswordFields(true);
      setIsProtectionEnabled(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove password protection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSave = async () => {
    if (isProtectionEnabled && password && password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (isProtectionEnabled && (!password || password !== confirmPassword)) {
      toast({
        title: "Invalid password",
        description: password
          ? "Passwords do not match."
          : "Please enter a password.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      if (isProtectionEnabled) {
        const result = await updatePasswordProtection(userId, password);
        toast({
          title: "Password Protection Updated",
          description: "Your portfolio is now password protected.",
          variant: "default",
        });
        setShowPasswordFields(false);
      } else {
        const result = await removePasswordProtection(userId);
        toast({
          title: "Password Protection Disabled",
          description: "Your portfolio is no longer password protected.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password protection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === "weak") return "text-red-500";
    if (passwordStrength === "medium") return "text-yellow-500";
    if (passwordStrength === "strong") return "text-green-500";
    return "";
  };

  return (
    <div className="min-h-screen ">
      <Card className=" py-6 mt-6 bg-transparent">
        <CardHeader className="px-4 py-3 ">
          <CardTitle className="mt-2 font-bold flex items-center gap-2 truncate tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            {isProtectionEnabled ? (
              <Lock className="h-5 w-5 text-purple-500" />
            ) : (
              <Unlock className="h-5 w-5 text-gray-500" />
            )}
            Password Protection
          </CardTitle>
        </CardHeader>
        <hr />
        <CardContent className="px-4 py-4 ">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Password Protection</p>
                <p className="text-sm text-muted-foreground">
                  Set a password to control who can view your portfolio.
                </p>
              </div>
              <Switch
                checked={isProtectionEnabled}
                onCheckedChange={toggleProtection}
              />
            </div>

            {isProtectionEnabled && (
              <div className="space-y-4 pt-4">
                {hasPassword && !showPasswordFields ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed p-3 rounded-md flex items-center">
                      <Check className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-sm">
                        Your portfolio is securely protected by a password.
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <RevButtons
                        variant="info"
                        onClick={showChangePasswordUI}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Change Password
                      </RevButtons>
                      <RevButtons
                        variant="destructive"
                        onClick={handleRemovePassword}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Password
                      </RevButtons>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create password"
                          value={password}
                          onChange={handlePasswordChange}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {passwordStrength && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className={getStrengthColor()}>
                            {passwordStrength === "weak" && (
                              <AlertCircle className="h-3 w-3 inline mr-1" />
                            )}
                            {passwordStrength === "medium" && (
                              <Check className="h-3 w-3 inline mr-1" />
                            )}
                            {passwordStrength === "strong" && (
                              <Check className="h-3 w-3 inline mr-1" />
                            )}
                            Password strength: {passwordStrength}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                      />
                      {password &&
                        confirmPassword &&
                        password !== confirmPassword && (
                          <p className="text-xs text-red-500">
                            Passwords do not match
                          </p>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <ul className="list-disc list-inside space-y-1">
                        <li
                          className={
                            password.length < 8
                              ? "text-red-500 font-medium"
                              : ""
                          }
                        >
                          Password should be at least 8 characters
                        </li>
                        <li>Include uppercase and lowercase letters</li>
                        <li>
                          Include at least one number and special character
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="pt-4">
              <RevButtons
                onClick={handleSave}
                disabled={
                  isUpdating ||
                  (isProtectionEnabled &&
                    showPasswordFields &&
                    (password !== confirmPassword ||
                      !password ||
                      password.length < 8))
                }
                variant="success"
                className="w-full"
              >
                {isUpdating ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isProtectionEnabled
                      ? hasPassword && !showPasswordFields
                        ? "Save Settings"
                        : hasPassword
                          ? "Update Password"
                          : "Set Password"
                      : "Save Settings"}
                  </>
                )}
              </RevButtons>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
