    } catch (err) {
      const m = formatApiErrorDetail(err.response?.data?.detail) || err.message || "Login failed";
      setErrorMsg(String(m) + (err.config?.baseURL ? ` [${err.config.baseURL}]` : ""));
      toast.error(m);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (creds) => {
