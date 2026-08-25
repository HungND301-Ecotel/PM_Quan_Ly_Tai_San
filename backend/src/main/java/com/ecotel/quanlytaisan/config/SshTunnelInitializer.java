package com.ecotel.quanlytaisan.config;

import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

@Component
public class SshTunnelInitializer {

    private static final Logger logger = LoggerFactory.getLogger(SshTunnelInitializer.class);
    private static Session sshSession;

    @Autowired
    private org.springframework.core.env.Environment env;

    @PostConstruct
    public void initialize() {
        
        String sshHost = env.getProperty("ssh.tunnel.host");
        String sshUser = env.getProperty("ssh.tunnel.user");
        String sshPassword = env.getProperty("ssh.tunnel.password");
        String sshPortStr = env.getProperty("ssh.tunnel.port", "2223");
        
        boolean enabled = env.getProperty("ssh.tunnel.enabled", Boolean.class, false);

        if (!enabled) {
            logger.info("SSH Tunnel is disabled in configuration.");
            return;
        }

        if (sshHost == null || sshHost.isEmpty() || sshUser == null || sshUser.isEmpty()) {
            logger.warn("SSH Tunnel is enabled but host/user is missing in application.properties");
            return;
        }

        try {
            int sshPort = Integer.parseInt(sshPortStr);
            JSch jsch = new JSch();
            sshSession = jsch.getSession(sshUser, sshHost, sshPort);
            sshSession.setPassword(sshPassword);
            
            // Disable strict host key checking
            java.util.Properties config = new java.util.Properties();
            config.put("StrictHostKeyChecking", "no");
            sshSession.setConfig(config);

            logger.info("Connecting to SSH Tunnel: {}@{}", sshUser, sshHost);
            sshSession.connect(10000); // 10s timeout
            
            // Forward port 27017 from localhost to the VPS's localhost:27017
            int localPort = 27018;
            String remoteHost = "127.0.0.1";
            int remotePort = env.getProperty("ssh.tunnel.remote-port", Integer.class, 27017);

            
            sshSession.setPortForwardingL(localPort, remoteHost, remotePort);
            logger.info("SSH Tunnel established! Port forwarded: {}:{} -> {}:{}", 
                    "localhost", localPort, remoteHost, remotePort);
            
            // Add a shutdown hook to close the tunnel when the application exits
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                if (sshSession != null && sshSession.isConnected()) {
                    logger.info("Closing SSH Tunnel...");
                    sshSession.disconnect();
                }
            }));
            
        } catch (Exception e) {
            logger.error("Failed to establish SSH Tunnel", e);
            throw new RuntimeException("SSH Tunnel Initialization Failed", e);
        }
    }
}
