    } catch (err) {
      const m = formatApiErrorDetail(err.response?.data?.detail) || err.message || "Login failed";
      setErrorMsg(String(m) + (err.config?.baseURL ? ` [${err.config.baseURL}]` : ""));
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your financial planning dashboard">
      {errorMsg && (
        <div data-testid="login-error" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}
