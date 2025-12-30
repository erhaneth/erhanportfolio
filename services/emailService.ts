/**
 * Service to send resume via email
 * This calls a backend API endpoint that handles the actual email sending
 */

export interface SendResumeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const sendResume = async (email: string, name: string): Promise<SendResumeResponse> => {
  try {
    // Call your backend API endpoint
    // In production: Netlify redirects /api/* to /.netlify/functions/*
    // In development: Vite proxy forwards /api/* to local server (see vite.config.ts)
    const response = await fetch('/api/send-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to send resume',
      };
    }

    return {
      success: true,
      message: data.message || 'Resume sent successfully!',
    };
  } catch (error) {
    console.error('Error sending resume:', error);
    return {
      success: false,
      error: 'Network error. Please try again later.',
    };
  }
};

