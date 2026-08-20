import { useState, useEffect } from "react"

function App() {
  const [message, setMessage] = useState("Loading...")
  const [directoryFile, setDirectoryFile] = useState(null)
  const [activityFile, setActivityFile] = useState(null)
  const [ingestStatus, setIngestStatus] = useState("")
  const [identities, setIdentities] = useState([])
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => setMessage("Error connecting to backend: " + error.message))
  }, [])

  const loadIdentities = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/identities")
      const data = await response.json()
      setIdentities(data.identities)
    } catch (error) {
      console.error("Failed to load identities:", error)
    }
  }

  const handleScan = async () => {
    if (!directoryFile || !activityFile) {
      setIngestStatus("Please select both files before scanning.")
      return
    }

    setIngestStatus("Scanning...")

    const formData = new FormData()
    formData.append("directory_file", directoryFile)
    formData.append("activity_file", activityFile)

    try {
      const response = await fetch("http://127.0.0.1:8000/ingest", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setIngestStatus("Error: " + (data.detail || "Something went wrong."))
        return
      }

      setIngestStatus(
        `Success! Ingested ${data.identities_inserted} identities and ${data.activities_inserted} activities.`
      )

      loadIdentities()
      setSelectedDetail(null) // clear old selection after a new scan
    } catch (error) {
      setIngestStatus("Error: " + error.message)
    }
  }

  const handleSelectIdentity = async (accountId) => {
    setDetailLoading(true)
    setSelectedDetail(null)

    try {
      const response = await fetch(`http://127.0.0.1:8000/identities/${accountId}`)
      const data = await response.json()
      setSelectedDetail(data)
    } catch (error) {
      console.error("Failed to load identity detail:", error)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px" }}>
      <h1>NHI Governance Dashboard</h1>
      <p style={{ color: "#666" }}>Backend status: {message}</p>

      <h2>Identity Discovery</h2>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ border: "1px dashed #999", padding: "1rem", flex: 1 }}>
          <p>Directory JSON</p>
          <input
            type="file"
            accept=".json"
            onChange={(e) => setDirectoryFile(e.target.files[0])}
          />
          {directoryFile && <p style={{ fontSize: "12px", color: "green" }}>Selected: {directoryFile.name}</p>}
        </div>

        <div style={{ border: "1px dashed #999", padding: "1rem", flex: 1 }}>
          <p>Activity JSON</p>
          <input
            type="file"
            accept=".json"
            onChange={(e) => setActivityFile(e.target.files[0])}
          />
          {activityFile && <p style={{ fontSize: "12px", color: "green" }}>Selected: {activityFile.name}</p>}
        </div>
      </div>

      <button style={{ padding: "0.5rem 1rem" }} onClick={handleScan}>
        Run Discovery Scan
      </button>

      {ingestStatus && <p style={{ marginTop: "1rem" }}>{ingestStatus}</p>}

      {identities.length > 0 && (
        <>
          <h2 style={{ marginTop: "2rem" }}>Identity Register</h2>
          <p style={{ fontSize: "13px", color: "#666" }}>Click a row to view its risk analysis</p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f0f0", textAlign: "left" }}>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>Account ID</th>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>Type</th>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>Assigned Agent</th>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {identities.map((identity) => (
                <tr
                  key={identity.account_id}
                  onClick={() => handleSelectIdentity(identity.account_id)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <td style={{ padding: "8px", border: "1px solid #ddd", fontFamily: "monospace" }}>
                    {identity.account_id}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{identity.type}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                    {identity.agent || <span style={{ color: "#999" }}>None</span>}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                    {identity.agent === null ? (
                      <span style={{ background: "#fee", color: "#c00", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                        ⚠ Orphan
                      </span>
                    ) : (
                      <span style={{ background: "#efe", color: "#080", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                        Assigned
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {detailLoading && <p style={{ marginTop: "2rem" }}>Loading risk analysis...</p>}

      {selectedDetail && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Risk Analysis</h2>
          <p style={{ color: "#666" }}>
            Selected identity: <code>{selectedDetail.identity.account_id}</code>
          </p>

          {/* Alert banners */}
          {selectedDetail.risks.map((risk, index) => (
            <div
              key={index}
              style={{
                background: risk.severity === "High" ? "#fee" : "#fff8e6",
                border: `1px solid ${risk.severity === "High" ? "#f99" : "#e6c200"}`,
                borderRadius: "6px",
                padding: "0.75rem 1rem",
                marginBottom: "8px",
              }}
            >
              <p style={{ fontWeight: "bold", margin: 0, color: risk.severity === "High" ? "#c00" : "#a66a00" }}>
                {risk.risk_type} ({risk.severity})
              </p>
              <p style={{ fontSize: "13px", margin: "4px 0 0", color: risk.severity === "High" ? "#c00" : "#a66a00" }}>
                {risk.reason}
              </p>
            </div>
          ))}

          {selectedDetail.risks.length === 0 && (
            <div style={{ background: "#efe", border: "1px solid #9c9", borderRadius: "6px", padding: "0.75rem 1rem", marginBottom: "8px" }}>
              <p style={{ margin: 0, color: "#080" }}>✅ No risks found for this identity.</p>
            </div>
          )}

          {/* Granted vs Used */}
          <h3 style={{ marginTop: "1.5rem" }}>Permissions: Granted vs Used</h3>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12px", color: "#666" }}>Granted</p>
              {selectedDetail.granted_permissions.map((perm) => {
                const isUsed = selectedDetail.used_permissions.includes(perm)
                return (
                  <div
                    key={perm}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      background: isUsed ? "#f0f0f0" : "#fff8e6",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      marginBottom: "4px",
                    }}
                  >
                    {perm} {!isUsed && <span style={{ color: "#a66a00" }}>(unused)</span>}
                  </div>
                )
              })}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12px", color: "#666" }}>Used (last 30 days)</p>
              {selectedDetail.used_permissions.length > 0 ? (
                selectedDetail.used_permissions.map((perm) => (
                  <div
                    key={perm}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      background: "#efe",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      marginBottom: "4px",
                    }}
                  >
                    {perm}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "12px", color: "#999" }}>— none —</p>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <h3 style={{ marginTop: "1.5rem" }}>Activity Timeline</h3>
          {selectedDetail.activity_timeline.length > 0 ? (
            selectedDetail.activity_timeline.map((event, index) => (
              <div key={index} style={{ fontSize: "13px", marginBottom: "4px" }}>
                <span style={{ fontFamily: "monospace", color: "#999", marginRight: "8px" }}>
                  {new Date(event.timestamp).toLocaleString()}
                </span>
                {event.action} <code>{event.resource}</code>
              </div>
            ))
          ) : (
            <p style={{ fontSize: "13px", color: "#999" }}>No activity recorded.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default App