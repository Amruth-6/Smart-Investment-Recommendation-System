    const token = localStorage.getItem("si_token");
    if (!token) {
      setUser(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("si_token");
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);
