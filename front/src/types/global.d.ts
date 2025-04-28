import React, { useState, useRef, useEffect } from "react";
import { ethers, BrowserProvider, Eip1193Provider } from "ethers";
import { useNavigate } from "react-router-dom";

declare global {
    interface Window {
        ethereum?: Record<string, unknown>;
        phantom?: {
            ethereum?: Record<string, unknown>;
        };
    }
}
