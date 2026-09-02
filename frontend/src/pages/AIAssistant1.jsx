              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-blue-500 text-white" : "border border-white/[0.08] bg-[#0E1117] text-slate-200"}`}>
                {!m.content && streaming && i === messages.length - 1 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </div>
