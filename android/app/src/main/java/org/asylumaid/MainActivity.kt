package org.asylumaid

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import org.asylumaid.state.AppViewModel
import org.asylumaid.ui.RootScreen
import org.osmdroid.config.Configuration
import java.io.File

class MainActivity : ComponentActivity() {
    private val vm: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // osmdroid needs a descriptive User-Agent (OSM tile servers 403 a blank one) and a
        // writable cache dir. Use app-private storage — no external-storage permission needed.
        Configuration.getInstance().apply {
            userAgentValue = packageName
            osmdroidBasePath = File(cacheDir, "osmdroid")
            osmdroidTileCache = File(osmdroidBasePath, "tiles")
        }

        enableEdgeToEdge()
        setContent { RootScreen(vm) }
    }
}
